package crud

import (
	"backend/internal/lib/gin_"
	"backend/internal/models/schemas"
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type DocumentReader[Read any] interface {
	Name() string
	Database() *mongo.Database
	FindOne(context.Context, any, ...*options.FindOneOptions) *mongo.SingleResult
	PostProcess(bson.Raw) (Read, error)
	PostProcessBson(bson.Raw) (bson.M, error)
	AuthRead(*schemas.UserRead, *Read) error
}

func GetDocument[Read any](
	dr DocumentReader[Read], filter bson.M, ctx context.Context,
) (bson.Raw, error) {
	result := dr.FindOne(ctx, filter)
	return result.Raw()
}

func GetDocumentById[Read any](
	dr DocumentReader[Read], id string, ctx context.Context,
) (bson.Raw, error) {
	objectId, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return bson.Raw{}, gin_.UnprocessableErr(
			fmt.Sprintf("invalid object ID %s", id), err,
		)
	}
	return GetDocument(dr, bson.M{"_id": objectId}, ctx)
}

func GetById[Read any](
	dr DocumentReader[Read], id string, ctx context.Context,
) (Read, error) {
	var zero Read

	// Get raw bson.Raw
	raw, err := GetDocumentById(dr, id, ctx)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return zero, gin_.IdNotFoundErr(dr.Name(), id)
		} else {
			return zero, fmt.Errorf("get document failed: %w", err)
		}
	}

	return dr.PostProcess(raw)
}

func Get[Read any](
	dr DocumentReader[Read], filter bson.M, ctx context.Context,
) (Read, error) {
	var zero Read

	// Get raw bson.Raw
	raw, err := GetDocument(dr, filter, ctx)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return zero, gin_.NotFoundErr(dr.Name(), filter)
		} else {
			return zero, fmt.Errorf("get document failed: %w", err)
		}
	}

	return dr.PostProcess(raw)
}

func UserGet[Read any](
	dr DocumentReader[Read],
	user *schemas.UserRead,
	filters bson.M,
	ctx context.Context,
) (Read, error) {
	result, err := Get(dr, filters, ctx)
	if err != nil {
		return result, err
	}

	if user == nil {
		var zero Read
		return zero, gin_.NotAuthenticatedErr()
	}

	err = dr.AuthRead(user, &result)
	if err != nil {
		return result, err
	}
	return result, nil
}

func UserGetById[Read any](
	dr DocumentReader[Read],
	user *schemas.UserRead,
	id string,
	ctx context.Context,
) (Read, error) {
	result, err := GetById(dr, id, ctx)
	if err != nil {
		return result, err
	}

	if user == nil {
		var zero Read
		return zero, gin_.NotAuthenticatedErr()
	}

	err = dr.AuthRead(user, &result)
	if err != nil {
		return result, err
	}
	return result, nil
}
