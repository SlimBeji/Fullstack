package crud

import (
	"backend/internal/config"
	"backend/internal/lib/gin_"
	"backend/internal/lib/types_"
	"backend/internal/models/schemas"
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"sync"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoFindQuery struct {
	Pagination *types_.PaginationData
	Filters    *bson.M
	Sort       *bson.D
	Projection *bson.M
}

type DocumentFetcher[Read any] interface {
	DocumentReader[Read]
	GetSecretFields() []string
	GetDefaultSorting() bson.D
	GetFiltersMapping() map[string]string
	CountDocuments(context.Context, any, ...*options.CountOptions) (int64, error)
	Find(context.Context, any, ...*options.FindOptions) (*mongo.Cursor, error)
	AddOwnershipFilters(*schemas.UserRead, *types_.FindQuery)
}

func parsePagination(page int, size int) types_.PaginationData {
	if page == 0 {
		page = 1
	}

	if size == 0 || size > config.Env.MaxItemsPerPage {
		size = config.Env.MaxItemsPerPage
	}

	return types_.PaginationData{Page: page, Size: size}
}

func parseSortData(fields []string) bson.D {
	result := bson.D{}

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

func parseProjection(fields []string) bson.M {
	result := make(bson.M)
	if len(fields) > 0 {
		result = bson.M{"_id": 0}
	}
	for _, item := range fields {
		if item == "id" {
			result["_id"] = 1
		} else {
			result[item] = 1
		}
	}
	return result
}

func parseFilters(
	filters types_.FindQueryFilters, nameMapping map[string]string,
) (bson.M, error) {
	result := bson.M{}
	if len(filters) == 0 {
		return result, nil
	}

	for key, fieldFilters := range filters {
		field := key
		if field == "id" {
			field = "_id"
		}
		if match, found := nameMapping[field]; found {
			field = match
		}

		conditions := bson.M{}
		for _, fieldFilter := range fieldFilters {
			operator := "$" + string(fieldFilter.Op)

			if fieldFilter.Op == types_.FilterText {
				conditions[operator] = bson.M{"$search": fieldFilter.Val}
			} else {
				if field == "_id" || field == "creatorId" {
					idErr := fmt.Errorf("%s is not a valid objectId", fieldFilter.Val)
					rawId, ok := fieldFilter.Val.(string)
					if !ok {
						return bson.M{}, idErr
					}
					objectId, err := primitive.ObjectIDFromHex(rawId)
					if err != nil {
						return bson.M{}, idErr
					}
					conditions[operator] = objectId
				} else {
					conditions[operator] = fieldFilter.Val
				}
			}
		}

		if len(conditions) > 0 {
			result[field] = conditions
		}

	}
	return result, nil
}

func sanitizeProjection[Read any](
	df DocumentFetcher[Read], projection bson.M,
) {
	if len(projection) == 0 {
		for _, field := range df.GetSecretFields() {
			projection[field] = 0
		}
		return
	}

	for _, field := range df.GetSecretFields() {
		val, found := projection[field]
		if found && val == 1 {
			delete(projection, field)
		}
	}
}

func parseFindQuery[Read any](
	df DocumentFetcher[Read], findQuery *types_.FindQuery,
) (*MongoFindQuery, error) {
	// Step 1: Parse the pagination
	pagination := parsePagination(findQuery.Page, findQuery.Size)

	// Step 2: Parse projection
	projection := parseProjection(findQuery.Fields)
	sanitizeProjection(df, projection)

	// Step 3: Parse Sort Data
	sort := df.GetDefaultSorting()
	if len(findQuery.Sort) > 0 {
		sort = parseSortData(findQuery.Sort)
	}

	// Step 4: Parse Filters
	filters, err := parseFilters(findQuery.Filters, df.GetFiltersMapping())
	if err != nil {

	}

	// Step 5: Return the MongoFindQuery
	return &MongoFindQuery{
		Pagination: &pagination,
		Projection: &projection,
		Sort:       &sort,
		Filters:    &filters,
	}, nil
}

func CountDocuments[Read any](
	df DocumentFetcher[Read], filters bson.M, ctx context.Context,
) (int, error) {
	count, err := df.CountDocuments(ctx, filters)
	return int(count), err
}

func FetchDocuments[Read any](
	df DocumentFetcher[Read],
	query *MongoFindQuery,
	ctx context.Context,
) ([]bson.Raw, error) {
	pagination := types_.PaginationData{Page: 1, Size: config.Env.MaxItemsPerPage}
	if query.Pagination != nil {
		pagination = *query.Pagination
	}

	filters := bson.M{}
	if query.Filters != nil {
		filters = *query.Filters
	}

	sort := df.GetDefaultSorting()
	if query.Sort != nil {
		sort = *query.Sort
	}

	projection := bson.M{}
	if query.Projection != nil {
		projection = *query.Projection
		sanitizeProjection(df, projection)
	}

	opts := options.Find().
		SetSort(sort).
		SetProjection(projection).
		SetCollation(&options.Collation{Locale: "en", Strength: 2}).
		SetSkip(int64(pagination.Skip())).
		SetLimit(int64(pagination.Size))

	result := []bson.Raw{}
	cursor, err := df.Find(ctx, filters, opts)
	if err != nil {
		return result, fmt.Errorf("could not fetch data: %w", err)
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		result = append(result, cursor.Current)
	}
	return result, nil
}

func fetchRawPage[Read any](
	df DocumentFetcher[Read],
	findQuery *types_.FindQuery,
	ctx context.Context,
) (types_.PaginatedData[bson.Raw], error) {
	var result types_.PaginatedData[bson.Raw]

	// Step 1: Parsing the FindQuery to Mongo language
	query, err := parseFindQuery(df, findQuery)
	if err != nil {
		return result, fmt.Errorf("could not parse the find query: %w", err)
	}

	// Step 2: Counting the output
	totalCount, err := CountDocuments(df, *query.Filters, ctx)
	if err != nil {
		return result, fmt.Errorf("could not fetch data: %w", err)
	}
	result.TotalPages = int(math.Ceil(float64(totalCount) / float64(query.Pagination.Size)))
	result.TotalCount = totalCount
	result.Page = query.Pagination.Page

	// Step 3: Fetching the raw data and serialize it
	raw, err := FetchDocuments(df, query, ctx)
	if err != nil {
		return result, fmt.Errorf("could not fetch data: %w", err)
	}

	// Step 4: Return Paginated Data
	result.Data = raw
	return result, nil
}

func postProcessBatch[Read any](
	items []bson.Raw, callback func(bson.Raw) (Read, error),
) ([]Read, error) {
	var wg sync.WaitGroup
	results := make([]Read, len(items))
	errs := make([]error, len(items))

	for i := range items {
		wg.Add(1)
		go func(index int) {
			defer wg.Done()
			decoded, err := callback(items[index])
			results[index] = decoded
			errs[index] = err
		}(i)
	}

	wg.Wait()
	err := errors.Join(errs...)
	if err != nil {
		return results, fmt.Errorf("post processing failed:\n%w", err)
	}

	return results, nil
}

func postProcessBsonBatch(
	items []bson.Raw, callback func(item bson.Raw) (bson.M, error),
) ([]bson.M, error) {
	var wg sync.WaitGroup
	results := make([]bson.M, len(items))
	errs := make([]error, len(items))

	for i := range items {
		wg.Add(1)
		go func(index int) {
			defer wg.Done()
			decoded, err := callback(items[index])
			results[index] = decoded
			errs[index] = err
		}(i)
	}

	wg.Wait()
	err := errors.Join(errs...)
	if err != nil {
		return results, fmt.Errorf("post processing failed:\n%w", err)
	}
	return results, nil
}

func FetchBsonPage[Read any](
	df DocumentFetcher[Read],
	findQuery *types_.FindQuery,
	ctx context.Context,
) (types_.PaginatedData[bson.M], error) {
	var result types_.PaginatedData[bson.M]

	rawPage, err := fetchRawPage(df, findQuery, ctx)
	if err != nil {
		return result, err
	}

	result.Page = rawPage.Page
	result.TotalPages = rawPage.TotalPages
	result.TotalCount = rawPage.TotalCount

	result.Data, err = postProcessBsonBatch(rawPage.Data, df.PostProcessBson)
	return result, err
}

func FetchPage[Read any](
	df DocumentFetcher[Read],
	findQuery *types_.FindQuery,
	ctx context.Context,
) (types_.PaginatedData[Read], error) {
	var result types_.PaginatedData[Read]
	if len(findQuery.Fields) > 0 {
		err := fmt.Errorf("fields projection detected. use FetchBsonPage isntead")
		return result, err
	}

	rawPage, err := fetchRawPage(df, findQuery, ctx)
	if err != nil {
		return result, err
	}

	result.Page = rawPage.Page
	result.TotalPages = rawPage.TotalPages
	result.TotalCount = rawPage.TotalCount

	result.Data, err = postProcessBatch(rawPage.Data, df.PostProcess)
	return result, err
}

func UserFetchBsonPage[Read any](
	df DocumentFetcher[Read],
	user *schemas.UserRead,
	findQuery *types_.FindQuery,
	ctx context.Context,
) (types_.PaginatedData[bson.M], error) {
	if findQuery == nil {
		findQuery = &types_.FindQuery{}
	}
	if user == nil {
		var zero types_.PaginatedData[bson.M]
		return zero, gin_.NotAuthenticatedErr()
	}
	df.AddOwnershipFilters(user, findQuery)
	return FetchBsonPage(df, findQuery, ctx)
}

func UserFetchPage[Read any](
	df DocumentFetcher[Read],
	user *schemas.UserRead,
	findQuery *types_.FindQuery,
	ctx context.Context,
) (types_.PaginatedData[Read], error) {
	if findQuery == nil {
		findQuery = &types_.FindQuery{}
	}
	if user == nil {
		var zero types_.PaginatedData[Read]
		return zero, gin_.NotAuthenticatedErr()
	}
	df.AddOwnershipFilters(user, findQuery)
	return FetchPage(df, findQuery, ctx)
}
