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

type DocumentReader[T any] interface {
	FindOne(context.Context, any, ...*options.FindOneOptions) *mongo.SingleResult
	Name() string
	PostProcess(*T) error
	AuthRead(*schemas.UserRead, *T) error
}

func GetDocument[T any](
	dr DocumentReader[T], filter bson.M, ctx context.Context,
) (bson.Raw, error) {
	result := dr.FindOne(ctx, filter)
	return result.Raw()
}

func GetDocumentById[T any](
	dr DocumentReader[T], id string, ctx context.Context,
) (bson.Raw, error) {
	objectId, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, types_.UnprocessableErr(
			fmt.Sprintf("invalid object ID %s", id), err,
		)
	}
	return GetDocument(dr, bson.M{"_id": objectId}, ctx)
}

func parseRaw[T any](
	dr DocumentReader[T], raw bson.Raw,
) (T, error) {
	var result T

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

func GetById[T any](
	dr DocumentReader[T], id string, ctx context.Context,
) (T, error) {
	var zero T

	// Get raw bson.Raw
	raw, err := GetDocumentById(dr, id, ctx)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return zero, types_.IdNotFoundErr(dr.Name(), id)
		} else {
			return zero, fmt.Errorf("get document failed: %w", err)
		}
	}

	return parseRaw(dr, raw)
}

func Get[T any](
	dr DocumentReader[T], filter bson.M, ctx context.Context,
) (T, error) {
	var zero T

	// Get raw bson.Raw
	raw, err := GetDocument(dr, filter, ctx)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return zero, types_.NotFoundErr(dr.Name(), filter)
		} else {
			return zero, fmt.Errorf("get document failed: %w", err)
		}
	}

	return parseRaw(dr, raw)
}

func UserGet[T any](
	dr DocumentReader[T],
	user *schemas.UserRead,
	filters bson.M,
	ctx context.Context,
) (T, error) {
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

func UserGetById[T any](
	dr DocumentReader[T],
	user *schemas.UserRead,
	id string,
	ctx context.Context,
) (T, error) {
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
