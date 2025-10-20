package scripts

import (
	"backend/internal/lib/clients"
	"backend/internal/models/schemas"
	"backend/internal/types_"
	"context"
	"errors"
	"fmt"
	"net/http"
	"sync"

	"github.com/jinzhu/copier"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type CrudEvent string

const (
	CreateEvent CrudEvent = "create"
	ReadEvent   CrudEvent = "read"
	UpdateEvent CrudEvent = "update"
	DeleteEvent CrudEvent = "delete"
)

type CrudUser struct {
	client     *clients.MongoClient
	collection *mongo.Collection
}

// Constructor & Functions & Properties

func NewCrudUser() *CrudUser {
	client := clients.GetMongo()
	collection := client.DB.Collection(string(types_.CollectionUsers))
	return &CrudUser{client: client, collection: collection}
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

// Create

func (crud *CrudUser) CreateDocument(data schemas.UserCreate, ctx context.Context) (*mongo.SingleResult, error) {
	operation := func(session mongo.SessionContext) (*mongo.SingleResult, error) {
		var zero *mongo.SingleResult
		var doc schemas.UserDB

		err := copier.Copy(&doc, &data)
		if err != nil {
			return zero, err
		}

		raw, err := crud.collection.InsertOne(session, doc)
		if err != nil {
			return zero, err
		}

		return crud.collection.FindOne(session, bson.M{"_id": raw.InsertedID}), nil
	}
	return RunWithinSession(*crud.client, ctx, operation)
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

////////////////////////////

func Debug() {
	crud := NewCrudUser()
	admin, _ := crud.Get("68d950a9fdc14be002c64151", context.Background())
	fmt.Println("Admin user", admin)

	form := schemas.UserPost{
		Name:     "Drogba",
		Email:    "drogba@chelsea.com",
		IsAdmin:  true,
		Password: "very_secret",
	}
	user, err := crud.Create(form, context.Background())
	fmt.Println(err, user)
}
