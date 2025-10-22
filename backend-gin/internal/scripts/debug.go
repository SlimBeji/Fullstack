package scripts

import (
	"backend/internal/lib/clients"
	"backend/internal/models/collections"
	"backend/internal/models/schemas"
	"backend/internal/types_"
	"context"
	"fmt"
	"math"
	"net/http"
	"reflect"
	"strings"
	"sync"
	"time"

	"github.com/jinzhu/copier"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type CrudEvent string

const (
	CreateEvent CrudEvent = "create"
	ReadEvent   CrudEvent = "read"
	UpdateEvent CrudEvent = "update"
	DeleteEvent CrudEvent = "delete"
)

type CrudUser struct {
	client              *clients.MongoClient
	collection          *mongo.Collection
	defaultProjection   bson.M
	filterFieldsMapping map[string]string
}

// Constructor & Functions & Properties

func NewCrudUser() *CrudUser {
	client := clients.GetMongo()
	collection := client.DB.Collection(string(types_.CollectionUsers))
	return &CrudUser{
		client:              client,
		collection:          collection,
		defaultProjection:   bson.M{"password": 0},
		filterFieldsMapping: make(map[string]string),
	}
}

func RunWithinSession[T any](
	mc clients.MongoClient,
	ctx context.Context,
	operation func(mongo.SessionContext) (T, error),
) (T, error) {
	var result T

	session, err := mc.Conn.StartSession()
	if err != nil {
		return result, err
	}
	defer session.EndSession(ctx)

	err = mongo.WithSession(ctx, session, func(sessionContext mongo.SessionContext) error {
		if err := session.StartTransaction(); err != nil {
			return err
		}
		result, err = operation(sessionContext)
		if err != nil {
			session.AbortTransaction(sessionContext)
			return err
		}

		return session.CommitTransaction(sessionContext)
	})

	return result, err
}

// Helpers

func (crud *CrudUser) NotFoundErr(id string) *types_.ApiError {
	return collections.NotFoundErr(crud.collection.Name(), id)
}

// Accessors

func (crud *CrudUser) authCheck(item *schemas.UserRead, data any, event CrudEvent) error {
	if item == nil {
		return &types_.ApiError{
			Code:    http.StatusUnauthorized,
			Message: "not Authenticated",
		}
	}

	if item.IsAdmin {
		return nil
	}

	switch event {
	case CreateEvent, DeleteEvent:
		return fmt.Errorf("only admins can create or delete users")
	case ReadEvent, UpdateEvent:
	default:
		return fmt.Errorf("unknown event %s", event)
	}

	accessDenied := &types_.ApiError{
		Code:    http.StatusUnauthorized,
		Message: fmt.Sprintf("access to user with id %s not granted", item.Id),
	}
	switch d := data.(type) {
	case schemas.UserRead:
		if d.Id != item.Id {
			return accessDenied
		}
	case schemas.UserPut:
	default:
		return accessDenied
	}

	return nil
}

func (crud *CrudUser) addOwnershipFilters(user *schemas.UserRead, findQuery *types_.FindQuery) {
	if findQuery.Filters == nil {
		findQuery.Filters = make(types_.FindQueryFilters)
	}

	ownershipFilter := types_.Filter{Op: types_.FilterEq, Val: user.Id}
	findQuery.Filters["id"] = append(findQuery.Filters["id"], ownershipFilter)
}

// Serialization

func (crud *CrudUser) postProcess(item any) error {
	storage := clients.GetStorage()

	switch d := item.(type) {
	case *schemas.UserRead:
		signedUrl, err := storage.GetSignedUrl(d.ImageUrl)
		if err != nil {
			return err
		}
		d.ImageUrl = signedUrl
	case *bson.M:
		imageUrl, exists := (*d)["imageUrl"]
		if !exists {
			return nil
		}

		signedUrl, err := storage.GetSignedUrl(imageUrl.(string))
		if err != nil {
			return err
		}
		(*d)["imageUrl"] = signedUrl
	default:
		return fmt.Errorf("unhandled type %T for %s serialization", d, crud.collection.Name())
	}

	return nil
}

func (crud *CrudUser) postProcessBsons(items []bson.M) []error {
	errors := make([]error, len(items))
	var wg sync.WaitGroup

	for i := range items {
		wg.Add(1)
		go func(index int) {
			defer wg.Done()
			errors[index] = crud.postProcess(&items[index])
		}(i)
	}

	wg.Wait()
	return errors
}

func (crud *CrudUser) postProcessRecords(items []schemas.UserRead) []error {
	errors := make([]error, len(items))
	var wg sync.WaitGroup

	for i := range items {
		wg.Add(1)
		go func(index int) {
			defer wg.Done()
			errors[index] = crud.postProcess(&items[index])
		}(i)
	}

	wg.Wait()
	return errors
}

func (crud *CrudUser) decodeResult(
	raw *mongo.SingleResult, dest *schemas.UserRead,
) error {
	err := raw.Decode(dest)
	if err != nil {
		return fmt.Errorf("decode failed: %w", err)
	}

	if err := crud.postProcess(dest); err != nil {
		return fmt.Errorf("post-process failed: %w", err)
	}

	return nil
}

// Read

func (crud *CrudUser) GetDocument(
	id string, ctx context.Context,
) (*mongo.SingleResult, error) {
	return collections.GetDocument(crud.collection, id, ctx)
}

func (crud *CrudUser) Get(
	id string, ctx context.Context,
) (schemas.UserRead, error) {
	return collections.Get(crud.collection, id, ctx, crud.decodeResult)
}

func (crud *CrudUser) UserGet(
	user *schemas.UserRead, id string, ctx context.Context,
) (schemas.UserRead, error) {
	var zero schemas.UserRead

	result, err := crud.Get(id, ctx)
	if err != nil {
		return zero, err
	}

	if err := crud.authCheck(user, result, ReadEvent); err != nil {
		return zero, err
	}

	return result, nil
}

// Fetch

func (crud *CrudUser) FetchDocuments(
	query types_.MongoFindQuery, ctx context.Context,
) ([]bson.Raw, error) {
	return collections.FetchDocuments(crud.collection, query, ctx)
}

func (crud *CrudUser) Fetch(
	findQuery types_.FindQuery, dest any, ctx context.Context,
) error {
	// Step 1: Parsing the FindQuery to Mongo language
	pagination := collections.ParsePagination(findQuery.Page, findQuery.Size)
	projection := collections.ParseProjection(findQuery.Fields, crud.defaultProjection)
	sort := collections.ParseSortData(findQuery.Sort)
	filters := collections.ParseFilters(findQuery.Filters, crud.filterFieldsMapping)
	query := types_.MongoFindQuery{
		Pagination: &pagination,
		Projection: &projection,
		Sort:       &sort,
		Filters:    &filters,
	}

	// Step 2: Counting teh output
	totalCount, err := collections.CountDocuments(crud.collection, filters, ctx)
	if err != nil {
		return fmt.Errorf("could not fetch data: %w", err)
	}
	totalPages := int(math.Ceil(float64(totalCount) / float64(pagination.Size)))

	// Step 3: Fetching the raw data and serialize it
	raw, err := crud.FetchDocuments(query, ctx)
	if err != nil {
		return fmt.Errorf("could not fetch data: %w", err)
	}

	// Step 4: Deserialize the data
	switch d := dest.(type) {
	case *types_.RecordsPaginated[schemas.UserRead]:
		d.Page = pagination.Page
		d.TotalPages = totalPages
		d.TotalCount = totalCount
		data := []schemas.UserRead{}
		for _, b := range raw {
			var user schemas.UserRead
			bson.Unmarshal(b, &user)
			data = append(data, user)
		}

		errs := crud.postProcessRecords(data)
		msgs := []string{}
		for _, err := range errs {
			if err != nil {
				msgs = append(msgs, err.Error())
			}
		}
		msg := strings.Join(msgs, "\n")
		if msg != "" {
			return fmt.Errorf("post processing failed: %s", msg)
		}

		d.Data = data

	case *types_.DataPaginated:
		d.Page = pagination.Page
		d.TotalPages = totalPages
		d.TotalCount = totalCount
		data := []bson.M{}
		for _, b := range raw {
			var item bson.M
			bson.Unmarshal(b, &item)
			data = append(data, item)
		}

		errs := crud.postProcessBsons(data)
		msgs := []string{}
		for _, err := range errs {
			if err != nil {
				msgs = append(msgs, err.Error())
			}
		}
		msg := strings.Join(msgs, "\n")
		if msg != "" {
			return fmt.Errorf("post processing failed: %s", msg)
		}

		d.Data = data
	default:
		return fmt.Errorf("could not serialize data: unhandled type %T", d)
	}

	return nil
}

func (crud *CrudUser) UserFetch(
	user schemas.UserRead,
	findQuery types_.FindQuery,
	dest any,
	ctx context.Context,
) error {
	crud.addOwnershipFilters(&user, &findQuery)
	return crud.Fetch(findQuery, dest, ctx)
}

// Create

func (crud *CrudUser) CreateDocument(data schemas.UserCreate, ctx context.Context) (*mongo.SingleResult, error) {
	return RunWithinSession(*crud.client, ctx, func(session mongo.SessionContext) (*mongo.SingleResult, error) {
		var zero *mongo.SingleResult
		var doc schemas.UserDB

		err := copier.Copy(&doc, &data)
		if err != nil {
			return zero, err
		}
		doc.UpdatedAt = time.Now()
		doc.CreatedAt = time.Now()
		doc.Places = []string{}

		raw, err := crud.collection.InsertOne(session, doc)
		if err != nil {
			return zero, err
		}

		return crud.collection.FindOne(session, bson.M{"_id": raw.InsertedID}), nil
	})
}

func (crud *CrudUser) Create(data schemas.UserPost, ctx context.Context) (schemas.UserRead, error) {
	var result schemas.UserRead
	var form schemas.UserCreate
	err := copier.Copy(&form, &data)
	if err != nil {
		return result, fmt.Errorf("could not prepare creation form: %w", err)
	}

	raw, err := crud.CreateDocument(form, ctx)
	if err != nil {
		return result, fmt.Errorf("could not create document: %w", err)
	}

	err = crud.decodeResult(raw, &result)
	return result, err
}

func (crud *CrudUser) UserCreate(user schemas.UserRead, data schemas.UserPost, ctx context.Context) (schemas.UserRead, error) {
	var zero schemas.UserRead
	if err := crud.authCheck(&user, data, CreateEvent); err != nil {
		return zero, err
	}
	return crud.Create(data, ctx)
}

// Update

func (crud *CrudUser) UpdateDocument(filter bson.M, form schemas.UserUpdate, ctx context.Context) (*mongo.SingleResult, error) {
	return RunWithinSession(*crud.client, ctx, func(session mongo.SessionContext) (*mongo.SingleResult, error) {
		var zero *mongo.SingleResult
		update := bson.M{
			"$set": bson.M{
				"updatedAt": time.Now(),
			},
		}

		formValue := reflect.ValueOf(form)
		formType := formValue.Type()
		for i := 0; i < formValue.NumField(); i++ {
			fieldValue := formValue.Field(i)
			fieldType := formType.Field(i)
			if fieldValue.Kind() == reflect.Pointer && !fieldValue.IsNil() {
				value := fieldValue.Elem().Interface()
				bsonTag := fieldType.Tag.Get("bson")
				update["$set"].(bson.M)[bsonTag] = value
			}
		}

		opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
		result := crud.collection.FindOneAndUpdate(session, filter, update, opts)

		if result.Err() != nil {
			return zero, result.Err()
		}

		return result, nil
	})
}

func (crud *CrudUser) Update(id string, data schemas.UserPut, ctx context.Context) (schemas.UserRead, error) {
	var result schemas.UserRead
	var form schemas.UserUpdate
	err := copier.Copy(&form, &data)
	if err != nil {
		return result, fmt.Errorf("could not prepare update form: %w", err)
	}

	objectId, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return result, fmt.Errorf("invalid user ID %s: %w", id, err)
	}

	raw, err := crud.UpdateDocument(bson.M{"_id": objectId}, form, ctx)
	if err != nil {
		return result, fmt.Errorf("could not update %s document: %w", id, err)
	}

	err = crud.decodeResult(raw, &result)
	return result, err
}

func (crud *CrudUser) UserUpdate(user schemas.UserRead, id string, data schemas.UserPut, ctx context.Context) (schemas.UserRead, error) {
	var zero schemas.UserRead

	// Read document to see if acessible by the user
	_, err := crud.UserGet(&user, id, ctx)

	if err != nil {
		return zero, err
	}

	if err := crud.authCheck(&user, data, UpdateEvent); err != nil {
		return zero, err
	}

	return crud.Update(id, data, ctx)
}

// Delete

func (crud *CrudUser) DeleteCleanup() {}

func (crud *CrudUser) DeleteDocument(filter bson.M, ctx context.Context) error {
	opertaion := func(session mongo.SessionContext) (*mongo.DeleteResult, error) {
		return crud.collection.DeleteOne(session, filter)
	}

	_, err := RunWithinSession(*crud.client, ctx, opertaion)
	if err != nil {
		return err
	}

	crud.DeleteCleanup()
	return nil
}

func (crud *CrudUser) Delete(id string, ctx context.Context) error {
	objectId, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return fmt.Errorf("invalid user ID %s: %w", id, err)
	}

	filter := bson.M{"_id": objectId}
	err = crud.DeleteDocument(filter, ctx)
	if err != nil {
		return fmt.Errorf("could not delete document %s from collection %s: %w", id, crud.collection.Name(), err)
	}

	return nil
}

func (crud *CrudUser) UserDelete(user schemas.UserRead, id string, ctx context.Context) error {
	item, err := crud.Get(id, ctx)
	if err != nil {
		return err
	}

	if err := crud.authCheck(&user, item, DeleteEvent); err != nil {
		return err
	}
	return crud.Delete(id, ctx)
}

////////////////////////////

func Debug() {
	crud := NewCrudUser()
	user, _ := crud.Get("68d950a9fdc14be002c64151", context.Background())
	fmt.Println(user)
	// fmt.Println("Admin user", admin)

	// form := schemas.UserPost{
	// 	Name:     "Drogba",
	// 	Email:    "drogba@chelsea.com",
	// 	IsAdmin:  true,
	// 	Password: "very_secret",
	// }
	// user, _ := crud.UserCreate(admin, form, context.Background())
	// fmt.Println("Created:", user)

	// nameFilters := []types_.Filter{{Op: "regex", Val: "Slim"}}
	// filters := map[string][]types_.Filter{"name": nameFilters}
	// query := types_.FindQuery{Filters: filters}

	// query := types_.FindQuery{
	// 	Filters: types_.FindQueryFilters{
	// 		"name": {{Op: "regex", Val: "Slim"}},
	// 	},
	// }
	// // data := types_.RecordsPaginated[schemas.UserRead]{}
	// data := types_.DataPaginated{}

	// // err := crud.UserFetch(user, query, &data, context.Background())
	// err := crud.Fetch(query, &data, context.Background())
	// fmt.Println(data)
	// fmt.Println(err)
}
