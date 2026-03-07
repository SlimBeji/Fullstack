package gorm_

import (
	"backend/internal/lib/types_"
	"backend/internal/lib/utils"
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"gorm.io/gorm"
)

// Query Helpers

type QueryBuilder interface {
	GetDB(ctx context.Context) *gorm.DB
	GetModel(ctx context.Context) *gorm.DB
	DefaultSelect() []string
	DefaultOrderBy() []string
	MaxItemsPerPage() int
	MapSelect(field string) []SelectField
	MapWhere(field string) string
	MapOrderBy(field string) string
}

func parseOrderBy(input string) OrderBy {
	if strings.HasPrefix(input, "-") {
		return OrderBy{
			Field: input[1:],
			Order: Desc,
		}
	}
	return OrderBy{
		Field: input,
		Order: Asc,
	}
}

func ApplyOrderBy(
	db *gorm.DB,
	clauses []string,
	mapFunc func(string) string,
) *gorm.DB {
	// Early exit
	if len(clauses) == 0 {
		return db
	}

	// Apply OrderBy
	for _, clause := range clauses {
		parsed := parseOrderBy(clause)
		db = db.Order(mapFunc(parsed.Field) + " " + parsed.Order)
	}

	// Return query
	return db
}

func ApplySelect(
	db *gorm.DB,
	clauses []string,
	mapFunc func(string) []SelectField,
) *gorm.DB {
	// Early exit
	if len(clauses) == 0 {
		return db
	}

	// Use map[string]bool to avoid duplicates
	selectSet := make(map[string]bool)
	joinSet := make(map[string]bool)

	// Collect all SelectFields and deduplicate
	for _, clause := range clauses {
		selectFields := mapFunc(clause)
		for _, sf := range selectFields {
			selectSet[sf.Select] = true
			if sf.JoinPath != "" {
				joinSet[sf.JoinPath] = true
			}
		}
	}

	// Apply joins
	for joinPath := range joinSet {
		db = db.Joins(joinPath)
	}

	// Apply selects (convert from map[string]bool to []string)
	selectFields := make([]string, 0, len(selectSet))
	for field := range selectSet {
		selectFields = append(selectFields, field)
	}
	db = db.Select(selectFields)

	// Return Query
	return db
}

func applySingleWhere(
	db *gorm.DB,
	path string,
	filter types_.Filter,
) (*gorm.DB, error) {
	switch filter.Op {
	case types_.FilterEq:
		return db.Where(fmt.Sprintf("%s = ?", path), filter.Val), nil
	case types_.FilterNe:
		return db.Where(fmt.Sprintf("%s != ?", path), filter.Val), nil
	case types_.FilterNull:
		if filter.Val.(bool) {
			return db.Where(fmt.Sprintf("%s IS NULL", path)), nil
		}
		return db.Where(fmt.Sprintf("%s IS NOT NULL", path)), nil
	case types_.FilterIn:
		return db.Where(fmt.Sprintf("%s IN ?", path), filter.Val), nil
	case types_.FilterNin:
		return db.Where(fmt.Sprintf("%s NOT IN ?", path), filter.Val), nil
	case types_.FilterLt:
		return db.Where(fmt.Sprintf("%s < ?", path), filter.Val), nil
	case types_.FilterLte:
		return db.Where(fmt.Sprintf("%s <= ?", path), filter.Val), nil
	case types_.FilterGt:
		return db.Where(fmt.Sprintf("%s > ?", path), filter.Val), nil
	case types_.FilterGte:
		return db.Where(fmt.Sprintf("%s >= ?", path), filter.Val), nil
	case types_.FilterLike:
		return db.Where(fmt.Sprintf("%s LIKE ?", path), fmt.Sprintf("%%%v%%", filter.Val)), nil
	case types_.FilterIlike:
		return db.Where(fmt.Sprintf("%s ILIKE ?", path), fmt.Sprintf("%%%v%%", filter.Val)), nil
	default:
		return nil, fmt.Errorf("unknown filter operator: %s", filter.Op)
	}
}

func ApplyWhere(
	db *gorm.DB,
	filters types_.WhereFilters,
	mapFunc func(string) string,
) (*gorm.DB, error) {
	for field, filterList := range filters {
		path := mapFunc(field)
		for _, filter := range filterList {
			var err error
			db, err = applySingleWhere(db, path, filter)
			if err != nil {
				return nil, err
			}
		}
	}

	return db, nil
}

func BuildSelectQuery(
	ctx context.Context,
	crud QueryBuilder,
	query types_.SearchQuery,
) (*gorm.DB, error) {
	qb := crud.GetModel(ctx)

	// Apply select
	selectFields := query.Select
	if len(selectFields) == 0 {
		selectFields = crud.DefaultSelect()
	}
	qb = ApplySelect(qb, selectFields, crud.MapSelect)

	// Apply where
	if len(query.Where) > 0 {
		var err error
		qb, err = ApplyWhere(qb, query.Where, crud.MapWhere)
		if err != nil {
			return nil, err
		}
	}

	// Apply orderby
	orderBy := query.OrderBy
	if len(orderBy) == 0 {
		orderBy = crud.DefaultOrderBy()
	}
	qb = ApplyOrderBy(qb, orderBy, crud.MapOrderBy)

	// Apply limit
	if query.Size > 0 {
		qb = qb.Limit(query.Size)
	}

	// Apply offset (pagination)
	if query.Page > 0 {
		size := query.Size
		if size == 0 {
			size = crud.MaxItemsPerPage()
		}
		offset := (query.Page - 1) * size
		qb = qb.Offset(offset)
	}

	return qb, nil
}

func Exists(
	ctx context.Context,
	crud QueryBuilder,
	where types_.WhereFilters,
) (bool, error) {
	qb := crud.GetModel(ctx)

	// Select only ID (minimal query)
	qb = qb.Select("id")

	// Apply where filters
	var err error
	qb, err = ApplyWhere(qb, where, crud.MapWhere)
	if err != nil {
		return false, err
	}

	// Check if any record exists
	var count int64
	err = qb.Limit(1).Count(&count).Error
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// Read Helpers

type RecordRead[User any, Model BaseModelReader, Read any] interface {
	QueryBuilder
	ModelName() string
	DefaultSelect() []string
	AuthGet(user User, query types_.SearchQuery) types_.SearchQuery
	ToRead(*Model) Read
	PostProcess(*Read) error
	PostProcessPartial(map[string]any) error
}

func Read[User any, Model BaseModelReader, Read any](
	ctx context.Context, crud RecordRead[User, Model, Read], id uint,
) (*Model, error) {
	var result Model
	err := crud.GetModel(ctx).First(&result, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Not found
		}
		return nil, err // Database error
	}
	return &result, nil
}

func Get[User any, Model BaseModelReader, Read any](
	ctx context.Context, crud RecordRead[User, Model, Read], id uint, user *User,
) (Read, error) {
	var zero Read

	// Build query
	selectFields := crud.DefaultSelect()
	query := types_.SearchQuery{
		Select: selectFields,
		Where: types_.WhereFilters{
			"id": types_.EqFilters(id),
		},
	}

	// Apply auth if user provided
	if user != nil {
		query = crud.AuthGet(*user, query)
	}

	// Build and execute query
	qb, err := BuildSelectQuery(ctx, crud, query)
	if err != nil {
		return zero, err
	}

	var model Model
	err = qb.First(&model).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return zero, types_.NotFoundError(crud.ModelName(), id)
		}
		return zero, err
	}

	return crud.ToRead(&model), nil
}

func GetPartial[User any, Model BaseModelReader, Read any](
	ctx context.Context,
	crud RecordRead[User, Model, Read],
	id uint,
	fields []string,
	user *User,
) (map[string]any, error) {
	// Build query
	selectFields := fields
	if len(selectFields) == 0 {
		selectFields = crud.DefaultSelect()
	}

	query := types_.SearchQuery{
		Select: selectFields,
		Where: types_.WhereFilters{
			"id": types_.EqFilters(id),
		},
	}

	// Apply auth if user provided
	if user != nil {
		query = crud.AuthGet(*user, query)
	}

	// Build and execute query
	qb, err := BuildSelectQuery(ctx, crud, query)
	if err != nil {
		return nil, err
	}

	var result map[string]any
	err = qb.First(&result).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, types_.NotFoundError(crud.ModelName(), id)
		}
		return nil, err
	}

	return result, nil
}

// Create Helpers

type RecordCreate[
	User any,
	Model BaseModelReader,
	Read any,
	Create any,
	Post any,
] interface {
	RecordRead[User, Model, Read]
	ToModel(Create) Model
	PostToCreate(Post) (Create, error)
	AuthPost(User, Post) error
	BeforeCreate(*gorm.DB, Create) error
	AfterCreate(*gorm.DB, uint, Create) error
}

func CreateRecord[User any, Model BaseModelReader, Read any, Create any, Post any](
	ctx context.Context,
	crud RecordCreate[User, Model, Read, Create, Post],
	data Create,
) (uint, error) {
	var createdID uint

	err := crud.GetDB(ctx).Transaction(func(tx *gorm.DB) error {
		// Convert Create to Model
		entity := crud.ToModel(data)

		// Before create hook
		if err := crud.BeforeCreate(tx, data); err != nil {
			return err
		}

		// Insert into database
		if err := tx.Create(&entity).Error; err != nil {
			return err
		}

		// Extract ID from entity
		createdID = entity.GetId()

		// After create hook
		if err := crud.AfterCreate(tx, createdID, data); err != nil {
			return err
		}

		return nil // Commit
	})

	if err != nil {
		// Check for duplicate key error
		if strings.Contains(err.Error(), "duplicate key") ||
			strings.Contains(err.Error(), "UNIQUE constraint") {
			return 0, types_.APIError{
				Code:    http.StatusConflict,
				Message: "Record already exists",
			}
		}

		return 0, types_.APIError{
			Code:    http.StatusInternalServerError,
			Message: fmt.Sprintf("Could not create %s object: %v", crud.ModelName(), err),
		}
	}

	return createdID, nil
}

func PostRecord[User any, Model BaseModelReader, Read any, Create any, Post any](
	ctx context.Context,
	crud RecordCreate[User, Model, Read, Create, Post],
	form Post,
	user *User,
) (uint, error) {
	if user != nil {
		err := crud.AuthPost(*user, form)
		if err != nil {
			return 0, err
		}
	}

	data, err := crud.PostToCreate(form)
	if err != nil {
		return 0, err
	}

	return CreateRecord(ctx, crud, data)
}

// Update Helpers

type RecordUpdate[
	User any,
	Model BaseModelReader,
	Read any,
	Update any,
	Put any,
] interface {
	RecordRead[User, Model, Read]
	PutToUpdate(Put) (Update, error)
	AuthPut(User, uint, Put) error
	BeforeUpdate(*gorm.DB, uint, Update) error
	AfterUpdate(*gorm.DB, uint, Update) error
}

func UpdateRecord[User any, Model BaseModelReader, Read any, Update any, Put any](
	ctx context.Context,
	crud RecordUpdate[User, Model, Read, Update, Put],
	id uint,
	data Update,
) error {
	err := crud.GetDB(ctx).Transaction(func(tx *gorm.DB) error {
		// Before update hook
		if err := crud.BeforeUpdate(tx, id, data); err != nil {
			return err
		}

		// Update in database
		result := tx.Model(new(Model)).Where("id = ?", id).Updates(data)
		if result.Error != nil {
			return result.Error
		}

		// Check if record exists
		if result.RowsAffected == 0 {
			return types_.NotFoundError(crud.ModelName(), id)
		}

		// After update hook
		if err := crud.AfterUpdate(tx, id, data); err != nil {
			return err
		}

		return nil // Commit
	})

	if err != nil {
		if errors.As(err, &types_.APIError{}) {
			return err
		}
		return types_.APIError{
			Code:    http.StatusInternalServerError,
			Message: fmt.Sprintf("Could not update %s object: %v", crud.ModelName(), err),
		}
	}

	return nil
}

func PutRecord[User any, Model BaseModelReader, Read any, Update any, Put any](
	ctx context.Context,
	crud RecordUpdate[User, Model, Read, Update, Put],
	id uint,
	form Put,
	user *User,
) error {
	if user != nil {
		err := crud.AuthPut(*user, id, form)
		if err != nil {
			return err
		}
	}

	data, err := crud.PutToUpdate(form)
	if err != nil {
		return err
	}

	return UpdateRecord(ctx, crud, id, data)
}

// Delete Helpers

type RecordDelete[User any, Model BaseModelReader, Read any] interface {
	RecordRead[User, Model, Read]
	AuthDelete(User, uint) error
	BeforeDelete(*gorm.DB, Model) error
	AfterDelete(*gorm.DB, Model) error
}

func DeleteRecord[User any, Model BaseModelReader, Read any](
	ctx context.Context,
	crud RecordDelete[User, Model, Read],
	id uint,
	user *User,
) error {
	// Fetch the record first
	var model Model
	err := crud.GetModel(ctx).First(&model, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return types_.NotFoundError(crud.ModelName(), id)
		}
		return err
	}

	// Check authoriztion
	if user != nil {
		if err := crud.AuthDelete(*user, id); err != nil {
			return err
		}
	}

	err = crud.GetDB(ctx).Transaction(func(tx *gorm.DB) error {
		// Before delete hook
		if err := crud.BeforeDelete(tx, model); err != nil {
			return err
		}

		// Delete from database
		result := tx.Delete(&model)
		if result.Error != nil {
			return result.Error
		}

		// After delete hook
		if err := crud.AfterDelete(tx, model); err != nil {
			return err
		}

		return nil // Commit
	})

	if err != nil {
		if errors.As(err, &types_.APIError{}) {
			return err
		}
		return types_.APIError{
			Code:    http.StatusInternalServerError,
			Message: fmt.Sprintf("Could not delete %s object: %v", crud.ModelName(), err),
		}
	}

	return nil
}

// Search Helpers

type RecordsSearch[User any, Model BaseModelReader, Read any] interface {
	RecordRead[User, Model, Read]
}

func Count[User any, Model BaseModelReader, Read any](
	ctx context.Context,
	crud RecordsSearch[User, Model, Read],
	query types_.SearchQuery,
) (int64, error) {
	qb := crud.GetModel(ctx)

	// Apply where filters
	if len(query.Where) > 0 {
		var err error
		qb, err = ApplyWhere(qb, query.Where, crud.MapWhere)
		if err != nil {
			return 0, err
		}
	}

	// Count records
	var count int64
	err := qb.Count(&count).Error
	if err != nil {
		return 0, err
	}

	return count, nil
}

func GetMany[User any, Model BaseModelReader, Read any](
	ctx context.Context,
	crud RecordsSearch[User, Model, Read],
	query types_.SearchQuery,
	user *User,
) ([]Read, error) {
	// Force default select for full Model
	query.Select = crud.DefaultSelect()

	// Apply defaults
	if len(query.OrderBy) == 0 {
		query.OrderBy = crud.DefaultOrderBy()
	}
	if query.Page == 0 {
		query.Page = 1
	}
	if query.Size == 0 {
		query.Size = crud.MaxItemsPerPage()
	}

	// Apply auth filter if user provided
	if user != nil {
		query = crud.AuthGet(*user, query)
	}

	// Build query
	qb, err := BuildSelectQuery(ctx, crud, query)
	if err != nil {
		return nil, err
	}

	// Execute query
	var models []Model
	err = qb.Find(&models).Error
	if err != nil {
		return nil, err
	}

	// Convert to Read schemas
	results := make([]Read, len(models))
	for i, model := range models {
		results[i] = crud.ToRead(&model)
	}
	return results, nil
}

func GetManyPartial[User any, Model BaseModelReader, Read any](
	ctx context.Context,
	crud RecordsSearch[User, Model, Read],
	query types_.SearchQuery,
	user *User,
) ([]map[string]any, error) {
	// Apply defaults
	if len(query.Select) == 0 {
		query.Select = crud.DefaultSelect()
	}
	if len(query.OrderBy) == 0 {
		query.OrderBy = crud.DefaultOrderBy()
	}
	if query.Page == 0 {
		query.Page = 1
	}
	if query.Size == 0 {
		query.Size = crud.MaxItemsPerPage()
	}

	// Apply auth filter if user provided
	if user != nil {
		query = crud.AuthGet(*user, query)
	}

	// Build query
	qb, err := BuildSelectQuery(ctx, crud, query)
	if err != nil {
		return nil, err
	}

	// Execute query into maps
	var results []map[string]any
	err = qb.Find(&results).Error
	if err != nil {
		return nil, err
	}

	return results, nil
}

func Paginate[User any, Model BaseModelReader, Read any](
	ctx context.Context,
	crud RecordsSearch[User, Model, Read],
	query types_.SearchQuery,
	user *User,
	process bool,
	workers int,
) (types_.PaginatedDict, error) {
	var zero types_.PaginatedDict

	// Step 1: Apply auth filter if user provided
	if user != nil {
		query = crud.AuthGet(*user, query)
	}

	// Step 2: Count total results
	totalCount, err := Count(ctx, crud, query)
	if err != nil {
		return zero, err
	}

	// Step 3: Calculate pagination
	page := query.Page
	if page == 0 {
		page = 1
	}
	size := query.Size
	if size == 0 {
		size = crud.MaxItemsPerPage()
	}
	totalPages := (int(totalCount) + size - 1) / size

	// Step 4: Normalize query
	query.Page = page
	query.Size = size

	// Step 5: Fetch results (without auth since already applied)
	data, err := GetManyPartial(ctx, crud, query, nil)
	if err != nil {
		return zero, err
	}

	// Step 6: Post-process if requested
	if process {
		processed, err := utils.BatchProcess(
			data,
			func(item map[string]any) (map[string]any, error) {
				err := crud.PostProcessPartial(item)
				return item, err
			},
			workers,
		)
		if err != nil {
			return zero, err
		}
		data = processed
	}

	// Step 7: Return paginated result
	return types_.PaginatedDict{
		Page:       page,
		TotalPages: totalPages,
		TotalCount: int(totalCount),
		Data:       data,
	}, nil
}
