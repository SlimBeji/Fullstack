package crud

import (
	"backend/internal/models/schemas"
	"backend/internal/types_"
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Read is the schemas to be serialized and returned
// Db is the schemas representing the DB document
// Form is the schemas for creation form, will be converted to Db
// Post is the schemas for POST request, will be converted to Form
type DocumentCreator[Read any, Db any, Form any, Post any] interface {
	DocumentReader[Read]
	InsertOne(context.Context, any, ...*options.InsertOneOptions) (*mongo.InsertOneResult, error)
	PostCreate(mongo.SessionContext) error
	ToCreateForm(*Post) (Form, error)
	ToDBDoc(*Form) (Db, error)
	AuthCreate(*schemas.UserRead, *Post) error
}

func CreateDocument[Read any, Db any, Form any, Post any](
	dc DocumentCreator[Read, Db, Form, Post],
	form *Form, ctx context.Context,
) (bson.Raw, error) {
	var result bson.Raw

	docIn, err := dc.ToDBDoc(form)
	if err != nil {
		return result, err
	}

	client := dc.Database().Client()
	session, err := client.StartSession()
	if err != nil {
		return result, err
	}
	defer session.EndSession(ctx)

	err = mongo.WithSession(
		ctx,
		session,
		func(sc mongo.SessionContext) error {
			if err := session.StartTransaction(); err != nil {
				return err
			}

			insertResult, err := dc.InsertOne(sc, docIn)
			if err != nil {
				session.AbortTransaction(sc)
				return err
			}

			err = dc.PostCreate(sc)
			if err != nil {
				session.AbortTransaction(sc)
				return err
			}

			if err := session.CommitTransaction(sc); err != nil {
				return err
			}

			filter := bson.M{"_id": insertResult.InsertedID}
			result, err = GetDocument(dc, filter, sc)
			return err
		},
	)

	return result, err
}

func Create[Read any, Db any, Form any, Post any](
	dc DocumentCreator[Read, Db, Form, Post],
	post *Post,
	ctx context.Context,
) (Read, error) {
	var result Read

	form, err := dc.ToCreateForm(post)
	if err != nil {
		return result, fmt.Errorf(
			"convertion to create form failed: %w", err,
		)
	}

	raw, err := CreateDocument(dc, &form, ctx)
	if err != nil {
		return result, err
	}

	return ParseRaw(dc, raw)
}

func UserCreate[Read any, Db any, Form any, Post any](
	dc DocumentCreator[Read, Db, Form, Post],
	user *schemas.UserRead,
	post *Post,
	ctx context.Context,
) (Read, error) {
	var zero Read
	if err := dc.AuthCreate(user, post); err != nil {
		return zero, types_.NotAdminErr(err)
	}
	return Create(dc, post, ctx)
}
