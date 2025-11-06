package crud

import (
	"backend/internal/models/schemas"
	"backend/internal/types_"
	"context"
	"errors"
	"fmt"
	"reflect"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type DocumentUpdater[Read any, Form any, Put any] interface {
	DocumentReader[Read]
	FindOneAndUpdate(context.Context, any, any, ...*options.FindOneAndUpdateOptions) *mongo.SingleResult
	PostUpdate(mongo.SessionContext) error
	ToUpdateForm(*Put) (Form, error)
	AuthUpdate(*schemas.UserRead, *Put) error
}

func updateFormToBson[T any](form *T) bson.M {
	update := bson.M{
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	formValue := reflect.ValueOf(*form)
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
	return update
}

func UpdateDocument[Read any, Form any, Put any](
	du DocumentUpdater[Read, Form, Put],
	filter bson.M,
	form *Form,
	ctx context.Context,
) (bson.Raw, error) {
	var result bson.Raw

	updates := updateFormToBson(form)
	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)

	client := du.Database().Client()
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

			raw := du.FindOneAndUpdate(sc, filter, updates, opts)
			result, err = raw.Raw()
			if err != nil {
				session.AbortTransaction(sc)
				return err
			}

			if err := du.PostUpdate(sc); err != nil {
				session.AbortTransaction(sc)
				return err
			}

			if err := session.CommitTransaction(sc); err != nil {
				return err
			}
			return nil
		},
	)

	return result, err
}

func UpdateDocumentById[Read any, Form any, Put any](
	du DocumentUpdater[Read, Form, Put],
	id string,
	form *Form,
	ctx context.Context,
) (bson.Raw, error) {
	objectId, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return bson.Raw{}, types_.UnprocessableErr(
			fmt.Sprintf("invalid object ID %s", id), err,
		)
	}
	return UpdateDocument(du, bson.M{"_id": objectId}, form, ctx)
}

func Update[Read any, Form any, Put any](
	du DocumentUpdater[Read, Form, Put],
	filter bson.M,
	put *Put,
	ctx context.Context,
) (Read, error) {
	var result Read

	form, err := du.ToUpdateForm(put)
	if err != nil {
		return result, fmt.Errorf(
			"convertion to update form failed: %w", err,
		)
	}

	raw, err := UpdateDocument(du, filter, &form, ctx)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return result, types_.NotFoundErr(du.Name(), filter)
		} else {
			return result, fmt.Errorf("update document failed: %w", err)
		}
	}

	return ParseRaw(du, raw)
}

func UpdateById[Read any, Form any, Put any](
	du DocumentUpdater[Read, Form, Put],
	id string,
	put *Put,
	ctx context.Context,
) (Read, error) {
	var zero Read
	objectId, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return zero, types_.UnprocessableErr(
			fmt.Sprintf("invalid object ID %s", id), err,
		)
	}
	return Update(du, bson.M{"_id": objectId}, put, ctx)
}

func UserUpdate[Read any, Form any, Put any](
	du DocumentUpdater[Read, Form, Put],
	user *schemas.UserRead,
	filters bson.M,
	put *Put,
	ctx context.Context,
) (Read, error) {
	var zero Read

	if user == nil {
		return zero, types_.NotAuthenticatedErr()
	}

	if put == nil {
		return zero, errors.New("no put form was provided")
	}

	_, err := UserGet(du, user, filters, ctx)
	if err != nil {
		return zero, err
	}

	if err := du.AuthUpdate(user, put); err != nil {
		return zero, err
	}

	return Update(du, filters, put, ctx)
}

func UserUpdateById[Read any, Form any, Put any](
	du DocumentUpdater[Read, Form, Put],
	user *schemas.UserRead,
	id string,
	put *Put,
	ctx context.Context,
) (Read, error) {
	var zero Read

	if user == nil {
		return zero, types_.NotAuthenticatedErr()
	}

	if put == nil {
		return zero, errors.New("no put form was provided")
	}

	_, err := UserGetById(du, user, id, ctx)
	if err != nil {
		return zero, err
	}

	if err := du.AuthUpdate(user, put); err != nil {
		return zero, err
	}

	return UpdateById(du, id, put, ctx)
}
