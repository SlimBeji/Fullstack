package collections

import (
	"backend/internal/types_"
	"context"
	"fmt"
	"net/http"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// Helpers

func NotFoundErr(name string, id string) *types_.ApiError {
	return &types_.ApiError{
		Code:    http.StatusNotFound,
		Message: fmt.Sprintf("No document with id %s found in %s", id, name),
	}
}

// Read

func GetDocument(
	collection *mongo.Collection,
	id string,
	ctx context.Context,
) (*mongo.SingleResult, error) {
	objectId, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID %s: %w", id, err)
	}
	return collection.FindOne(ctx, bson.M{"_id": objectId}), nil
}

func Get[T any](
	collection *mongo.Collection,
	id string,
	ctx context.Context,
	decoder func(raw *mongo.SingleResult, dest *T) error,
) (T, error) {
	var result T
	raw, err := GetDocument(collection, id, ctx)
	if err != nil {
		return result, fmt.Errorf("get document failed: %w", err)
	}

	if err := raw.Err(); err != nil {
		if err == mongo.ErrNoDocuments {
			return result, NotFoundErr(collection.Name(), id)
		} else {
			return result, fmt.Errorf("get document failed: %w", err)
		}
	}

	if err := decoder(raw, &result); err != nil {
		return result, fmt.Errorf("decode failed: %w", err)
	}

	return result, err
}
