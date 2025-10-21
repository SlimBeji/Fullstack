package scripts

import (
	"backend/internal/lib/clients"
	"backend/internal/models/schemas"
	"backend/internal/types_"
	"context"
	"errors"
	"fmt"
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

func (crud *CrudUser) ModelName() string {
	return crud.collection.Name()
}

// Helpers

func (crud *CrudUser) NotFoundErr(id string) *types_.ApiError {
	return &types_.ApiError{
		Code:    http.StatusNotFound,
		Message: fmt.Sprintf("No document with id %s found in %s", id, crud.ModelName()),
	}
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

// Serialization

func (crud *CrudUser) postProcess(item *schemas.UserRead) error {
	storage := clients.GetStorage()
	signedUrl, err := storage.GetSignedUrl(item.ImageUrl)
	if err != nil {
		return err
	}
	item.ImageUrl = signedUrl
	return nil
}

func (crud *CrudUser) postProcessResults(items []*schemas.UserRead) []error {
	errors := make([]error, len(items))
	var wg sync.WaitGroup

	for i, item := range items {
		wg.Add(1)
		go func(index int, item *schemas.UserRead) {
			defer wg.Done()
			errors[index] = crud.postProcess(item)
		}(i, item)
	}

	wg.Wait()
	return errors
}

func (crud *CrudUser) decodeResult(raw *mongo.SingleResult) (schemas.UserRead, error) {
	var result schemas.UserRead

	err := raw.Decode(&result)
	if err != nil {
		return result, fmt.Errorf("decode failed: %w", err)
	}

	if err := crud.postProcess(&result); err != nil {
		return result, fmt.Errorf("post-process failed: %w", err)
	}

	return result, err
}

// Read

func (crud *CrudUser) GetDocument(id string, ctx context.Context) (*mongo.SingleResult, error) {
	objectId, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID %s: %w", id, err)
	}
	return crud.collection.FindOne(ctx, bson.M{"_id": objectId}), nil
}

func (crud *CrudUser) Get(id string, ctx context.Context) (schemas.UserRead, error) {
	var result schemas.UserRead
	raw, err := crud.GetDocument(id, ctx)
	if err != nil {
		return result, fmt.Errorf("get document failed: %w", err)
	}

	result, err = crud.decodeResult(raw)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return result, crud.NotFoundErr(id)
		}
		return result, fmt.Errorf("decode failed: %w", err)
	}

	return result, err
}

func (crud *CrudUser) UserGet(user schemas.UserRead, id string, ctx context.Context) (schemas.UserRead, error) {
	var zero schemas.UserRead

	result, err := crud.Get(id, ctx)
	if err != nil {
		return zero, err
	}

	if err := crud.authCheck(&user, result, ReadEvent); err != nil {
		return zero, err
	}

	return result, nil
}

// Fetch

func (crud *CrudUser) parseSortData(fields []string) bson.D {
	result := bson.D{}

	if len(fields) == 0 {
		return bson.D{{Key: "createdAt", Value: 1}}
	}

	for _, field := range fields {
		order := 1
		if strings.HasPrefix(field, "-") {
			order = -1
			field = strings.TrimLeft(field, "-")
		}
		result = append(result, bson.E{Key: field, Value: order})
	}

	return result
}

func (crud *CrudUser) parseProjection(fields []string) bson.M {
	if len(fields) == 0 {
		return crud.defaultProjection
	}

	result := make(bson.M)
	for _, item := range fields {
		if item == "id" {
			result["_id"] = 1
		} else {
			result[item] = 1
		}
	}

	return result
}

func (crud *CrudUser) parseFilters(filters types_.FindQueryFilters) bson.M {
	result := bson.M{}
	if len(filters) == 0 {
		return result
	}

	for key, fieldFilters := range filters {
		field := key
		if field == "id" {
			field = "_id"
		}
		match, found := crud.filterFieldsMapping[field]
		if found {
			field = match
		}

		conditions := bson.M{}
		for _, fieldFilter := range fieldFilters {
			operator := "$" + string(fieldFilter.Op)

			if fieldFilter.Op == types_.FilterText {
				conditions[operator] = bson.M{"$search": fieldFilter.Val}
			} else {
				conditions[operator] = fieldFilter.Val
			}
		}

		if len(conditions) > 0 {
			result[field] = conditions
		}

	}
	return result
}

func (crud *CrudUser) CountDocuments(filters bson.M, ctx context.Context) (int, error) {
	count, err := crud.collection.CountDocuments(ctx, filters)
	return int(count), err
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
	var zero schemas.UserRead
	var form schemas.UserCreate
	err := copier.Copy(&form, &data)
	if err != nil {
		return zero, fmt.Errorf("could not prepare creation form: %w", err)
	}

	raw, err := crud.CreateDocument(form, ctx)
	if err != nil {
		return zero, fmt.Errorf("could not create document: %w", err)
	}

	return crud.decodeResult(raw)
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
	var zero schemas.UserRead
	var form schemas.UserUpdate
	err := copier.Copy(&form, &data)
	if err != nil {
		return zero, fmt.Errorf("could not prepare update form: %w", err)
	}

	objectId, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return zero, fmt.Errorf("invalid user ID %s: %w", id, err)
	}

	raw, err := crud.UpdateDocument(bson.M{"_id": objectId}, form, ctx)
	if err != nil {
		return zero, fmt.Errorf("could not update %s document: %w", id, err)
	}

	return crud.decodeResult(raw)
}

func (crud *CrudUser) UserUpdate(user schemas.UserRead, id string, data schemas.UserPut, ctx context.Context) (schemas.UserRead, error) {
	var zero schemas.UserRead

	// Read document to see if acessible by the user
	_, err := crud.UserGet(user, id, ctx)

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
		return fmt.Errorf("could not delete document %s from collection %s: %w", id, crud.ModelName(), err)
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
	// admin, _ := crud.Get("68d950a9fdc14be002c64151", context.Background())
	// fmt.Println("Admin user", admin)

	// form := schemas.UserPost{
	// 	Name:     "Drogba",
	// 	Email:    "drogba@chelsea.com",
	// 	IsAdmin:  true,
	// 	Password: "very_secret",
	// }
	// user, _ := crud.UserCreate(admin, form, context.Background())
	// fmt.Println("Created:", user)

	count, err := crud.CountDocuments(bson.M{"name": bson.M{"$regex": "Slim"}}, context.Background())
	fmt.Println(count, err)
}
