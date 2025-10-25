package crud

import (
	"backend/internal/models/schemas"
	"backend/internal/types_"
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
	PostProcess(*Read) error
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
		return bson.Raw{}, types_.UnprocessableErr(
			fmt.Sprintf("invalid object ID %s", id), err,
		)
	}
	return GetDocument(dr, bson.M{"_id": objectId}, ctx)
}

func ParseRaw[Read any](
	dr DocumentReader[Read], raw bson.Raw,
) (Read, error) {
	var result Read

	// Decode bson.Raw to T
	if err := bson.Unmarshal(raw, &result); err != nil {
		return result, fmt.Errorf("decode failed: %w", err)
	}

	// Post process decoded struct
	if err := dr.PostProcess(&result); err != nil {
		return result, fmt.Errorf("post processing failed: %w", err)
	}

	return result, nil
}

func GetById[Read any](
	dr DocumentReader[Read], id string, ctx context.Context,
) (Read, error) {
	var zero Read

	// Get raw bson.Raw
	raw, err := GetDocumentById(dr, id, ctx)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return zero, types_.IdNotFoundErr(dr.Name(), id)
		} else {
			return zero, fmt.Errorf("get document failed: %w", err)
		}
	}

	return ParseRaw(dr, raw)
}

func Get[Read any](
	dr DocumentReader[Read], filter bson.M, ctx context.Context,
) (Read, error) {
	var zero Read

	// Get raw bson.Raw
	raw, err := GetDocument(dr, filter, ctx)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return zero, types_.NotFoundErr(dr.Name(), filter)
		} else {
			return zero, fmt.Errorf("get document failed: %w", err)
		}
	}

	return ParseRaw(dr, raw)
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

	err = dr.AuthRead(user, &result)
	if err != nil {
		return result, err
	}
	return result, nil
}
