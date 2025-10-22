package collections

import (
	"backend/internal/config"
	"backend/internal/lib/clients"
	"backend/internal/types_"
	"context"
	"fmt"
	"net/http"
	"strings"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ACID

func RunWithinSession[T any](
	ctx context.Context,
	operation func(mongo.SessionContext) (T, error),
) (T, error) {
	var result T

	mc := clients.GetMongo()
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
		return nil, fmt.Errorf("invalid object ID %s: %w", id, err)
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

// Fetch

func ParsePagination(page int, size int) types_.Pagination {
	if page == 0 {
		page = 1
	}

	if size == 0 || size > config.Env.MaxItemsPerPage {
		size = config.Env.MaxItemsPerPage
	}

	return types_.Pagination{Page: page, Size: size}
}

func ParseSortData(fields []string) bson.D {
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

func ParseProjection(fields []string, defaultProjection bson.M) bson.M {
	if len(fields) == 0 {
		return defaultProjection
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

func ParseFilters(
	filters types_.FindQueryFilters, nameMapping map[string]string,
) bson.M {
	result := bson.M{}
	if len(filters) == 0 {
		return result
	}

	for key, fieldFilters := range filters {
		field := key
		if field == "id" {
			field = "_id"
		}
		match, found := nameMapping[field]
		if found {
			field = match
		}

		conditions := bson.M{}
		for _, fieldFilter := range fieldFilters {
			operator := "$" + string(fieldFilter.Op)

			if fieldFilter.Op == types_.FilterText {
				conditions[operator] = bson.M{"$search": fieldFilter.Val}
			} else {
				if field == "_id" {
					objectId, err := primitive.ObjectIDFromHex(fieldFilter.Val.(string))
					if err == nil {
						conditions[operator] = objectId
					}
				} else {
					conditions[operator] = fieldFilter.Val
				}
			}
		}

		if len(conditions) > 0 {
			result[field] = conditions
		}

	}
	return result
}

func CountDocuments(
	collection *mongo.Collection, filters bson.M, ctx context.Context,
) (int, error) {
	count, err := collection.CountDocuments(ctx, filters)
	return int(count), err
}

func FetchDocuments(
	collection *mongo.Collection,
	query types_.MongoFindQuery,
	ctx context.Context,
) ([]bson.Raw, error) {
	pagination := types_.Pagination{Page: 1, Size: config.Env.MaxItemsPerPage}
	if query.Pagination != nil {
		pagination = *query.Pagination
	}

	filters := bson.M{}
	if query.Filters != nil {
		filters = *query.Filters
	}

	sort := bson.D{{Key: "createdAt", Value: 1}}
	if query.Sort != nil {
		sort = *query.Sort
	}

	projection := bson.M{}
	if query.Projection != nil {
		projection = *query.Projection
	}

	opts := options.Find().
		SetSort(sort).
		SetProjection(projection).
		SetCollation(&options.Collation{Locale: "en", Strength: 2}).
		SetSkip(int64(pagination.Skip())).
		SetLimit(int64(pagination.Size))

	result := []bson.Raw{}
	cursor, err := collection.Find(ctx, filters, opts)
	if err != nil {
		return result, fmt.Errorf("could not fetch data: %w", err)
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		result = append(result, cursor.Current)
	}
	return result, nil
}

// Create

func CreateDocument[T any](
	collection *mongo.Collection, doc T, ctx context.Context,
) (*mongo.SingleResult, error) {
	return RunWithinSession(
		ctx,
		func(session mongo.SessionContext) (*mongo.SingleResult, error) {
			var zero *mongo.SingleResult

			raw, err := collection.InsertOne(session, doc)
			if err != nil {
				return zero, err
			}

			result := collection.FindOne(session, bson.M{"_id": raw.InsertedID})
			return result, nil
		},
	)
}
