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

// Cruds Utils

type CrudsUtils interface {
	GetDB(ctx context.Context) *gorm.DB
	GetModel(ctx context.Context) *gorm.DB
	ModelName() string
	DefaultSelect() []string
	DefaultOrderBy() []string
	MaxItemsPerPage() int
	MapSelect(field string) []SelectField
	MapWhere(field string) string
	MapOrderBy(field string) string
}

func BuildSelectQuery(
	ctx context.Context,
	cruds CrudsUtils,
	query types_.SearchQuery,
) (*gorm.DB, error) {
	qb := cruds.GetModel(ctx)

	// Apply select
	selectFields := query.Select
	if len(selectFields) == 0 {
		selectFields = cruds.DefaultSelect()
	}
	qb = ApplySelect(qb, selectFields, cruds.MapSelect)

	// Apply where
	if len(query.Where) > 0 {
		var err error
		qb, err = ApplyWhere(qb, query.Where, cruds.MapWhere)
		if err != nil {
			return nil, err
		}
	}

	// Apply orderby
	orderBy := query.OrderBy
	if len(orderBy) == 0 {
		orderBy = cruds.DefaultOrderBy()
	}
	qb = ApplyOrderBy(qb, orderBy, cruds.MapOrderBy)

	// Apply limit
	if query.Size > 0 {
		qb = qb.Limit(query.Size)
	}

	// Apply offset (pagination)
	if query.Page > 0 {
		size := query.Size
		if size == 0 {
			size = cruds.MaxItemsPerPage()
		}
		offset := (query.Page - 1) * size
		qb = qb.Offset(offset)
	}

	return qb, nil
}

func Exists(
	ctx context.Context,
	cruds CrudsUtils,
	where types_.WhereFilters,
) (bool, error) {
	qb := cruds.GetModel(ctx)

	// Select only ID (minimal query)
	qb = qb.Select("id")

	// Apply where filters
	var err error
	qb, err = ApplyWhere(qb, where, cruds.MapWhere)
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
	CrudsUtils
	AuthGet(context.Context, User, types_.SearchQuery) types_.SearchQuery
	ToRead(*Model) Read
	ToJSON(Model, []string) (map[string]any, error)
	PostProcess(context.Context, *Read) error
	PostProcessPartial(context.Context, map[string]any) error
}

func Read[User any, Model BaseModelReader, Read any](
	ctx context.Context, cruds RecordRead[User, Model, Read], id uint,
) (*Model, error) {
	var result Model
	err := cruds.GetModel(ctx).First(&result, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Not found
		}
		return nil, err // Database error
	}
	return &result, nil
}

func getRaw[User any, Model BaseModelReader, Read any](
	ctx context.Context,
	cruds RecordRead[User, Model, Read],
	id uint,
	fields []string,
	user *User,
) (Model, error) {
	var zero Model

	// Build query
	query := types_.SearchQuery{
		Select: fields,
		Where: types_.WhereFilters{
			"id": types_.EqFilters(id),
		},
	}

	// Apply auth if user provided
	if user != nil {
		query = cruds.AuthGet(ctx, *user, query)
	}

	// Build and execute query
	qb, err := BuildSelectQuery(ctx, cruds, query)
	if err != nil {
		return zero, err
	}

	var model Model
	err = qb.First(&model).Error
	return model, err
}

func Get[User any, Model BaseModelReader, Read any](
	ctx context.Context, cruds RecordRead[User, Model, Read], id uint, user *User,
) (Read, error) {
	var zero Read
	model, err := getRaw(ctx, cruds, id, []string{}, user)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return zero, types_.NotFoundError(cruds.ModelName(), id)
		}
		return zero, err
	}

	return cruds.ToRead(&model), nil
}

func GetPartial[User any, Model BaseModelReader, Read any](
	ctx context.Context,
	cruds RecordRead[User, Model, Read],
	id uint,
	fields []string,
	user *User,
) (map[string]any, error) {
	result := make(map[string]any)
	model, err := getRaw(ctx, cruds, id, fields, user)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return result, types_.NotFoundError(cruds.ModelName(), id)
		}
		return result, err
	}

	finalFields := GetSelectedFields(fields, cruds.MapSelect)
	return cruds.ToJSON(model, finalFields)
}

// Create Helpers

type RecordCreate[
	User any,
	Model BaseModelReader,
	Read any,
	Create any,
	HooksData any,
	Post any,
] interface {
	RecordRead[User, Model, Read]
	CreateToModel(Create) Model
	PostToCreate(context.Context, Post) (Create, error)
	AuthPost(context.Context, User, Post) error
	BeforeCreate(*gorm.DB, Create) (HooksData, error)
	AfterCreate(*gorm.DB, uint, Create, HooksData) error
}

func CreateRecord[User any, Model BaseModelReader, Read any, Create any, HooksData any, Post any](
	ctx context.Context,
	cruds RecordCreate[User, Model, Read, Create, HooksData, Post],
	data Create,
) (uint, error) {
	var createdID uint

	err := cruds.GetDB(ctx).Transaction(func(tx *gorm.DB) error {
		// Convert Create to Model
		entity := cruds.CreateToModel(data)

		// Before create hook
		hooksData, err := cruds.BeforeCreate(tx, data)
		if err != nil {
			return err
		}

		// Insert into database
		if err := tx.Create(&entity).Error; err != nil {
			return err
		}

		// Extract ID from entity
		createdID = entity.GetId()

		// After create hook
		if err := cruds.AfterCreate(tx, createdID, data, hooksData); err != nil {
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
			Message: fmt.Sprintf("Could not create %s object: %v", cruds.ModelName(), err),
		}
	}

	return createdID, nil
}

func PostRecord[User any, Model BaseModelReader, Read any, Create any, HooksData any, Post any](
	ctx context.Context,
	cruds RecordCreate[User, Model, Read, Create, HooksData, Post],
	form Post,
	user *User,
) (uint, error) {
	if user != nil {
		err := cruds.AuthPost(ctx, *user, form)
		if err != nil {
			return 0, err
		}
	}

	data, err := cruds.PostToCreate(ctx, form)
	if err != nil {
		return 0, err
	}

	return CreateRecord(ctx, cruds, data)
}

// Update Helpers

type RecordUpdate[
	User any,
	Model BaseModelReader,
	Read any,
	Update any,
	HooksData any,
	Put any,
] interface {
	RecordRead[User, Model, Read]
	PutToUpdate(context.Context, Put) (Update, error)
	AuthPut(context.Context, User, uint, Put) error
	BeforeUpdate(*gorm.DB, uint, Update) (HooksData, error)
	AfterUpdate(*gorm.DB, uint, Update, HooksData) error
}

func UpdateRecord[User any, Model BaseModelReader, Read any, Update any, HooksData any, Put any](
	ctx context.Context,
	cruds RecordUpdate[User, Model, Read, Update, HooksData, Put],
	id uint,
	data Update,
) error {
	err := cruds.GetDB(ctx).Transaction(func(tx *gorm.DB) error {
		// Before update hook
		hooksData, err := cruds.BeforeUpdate(tx, id, data)
		if err != nil {
			return err
		}

		// Update in database
		result := tx.Model(new(Model)).Where("id = ?", id).Updates(data)
		if result.Error != nil {
			return result.Error
		}

		// Check if record exists
		if result.RowsAffected == 0 {
			return types_.NotFoundError(cruds.ModelName(), id)
		}

		// After update hook
		if err := cruds.AfterUpdate(tx, id, data, hooksData); err != nil {
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
			Message: fmt.Sprintf("Could not update %s object: %v", cruds.ModelName(), err),
		}
	}

	return nil
}

func PutRecord[User any, Model BaseModelReader, Read any, Update any, HooksData any, Put any](
	ctx context.Context,
	cruds RecordUpdate[User, Model, Read, Update, HooksData, Put],
	id uint,
	form Put,
	user *User,
) error {
	if user != nil {
		err := cruds.AuthPut(ctx, *user, id, form)
		if err != nil {
			return err
		}
	}

	data, err := cruds.PutToUpdate(ctx, form)
	if err != nil {
		return err
	}

	return UpdateRecord(ctx, cruds, id, data)
}

// Delete Helpers

type RecordDelete[User any, Model BaseModelReader, Read any, HooksData any] interface {
	RecordRead[User, Model, Read]
	AuthDelete(context.Context, User, uint) error
	BeforeDelete(*gorm.DB, uint) (HooksData, error)
	AfterDelete(*gorm.DB, uint, HooksData) error
}

func DeleteRecord[User any, Model BaseModelReader, Read any, HooksData any](
	ctx context.Context,
	cruds RecordDelete[User, Model, Read, HooksData],
	id uint,
	user *User,
) error {
	// Check authoriztion
	if user != nil {
		if err := cruds.AuthDelete(ctx, *user, id); err != nil {
			return err
		}
	}

	err := cruds.GetDB(ctx).Transaction(func(tx *gorm.DB) error {
		// Before delete hook
		hooksData, err := cruds.BeforeDelete(tx, id)
		if err != nil {
			return err
		}

		// Delete from database
		var model Model
		result := tx.Delete(&model, id)
		if result.Error != nil {
			return result.Error
		}

		// Check if record was found and deleted
		if result.RowsAffected == 0 {
			return types_.NotFoundError(cruds.ModelName(), id)
		}

		// After delete hook
		if err := cruds.AfterDelete(tx, id, hooksData); err != nil {
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
			Message: fmt.Sprintf("Could not delete %s object: %v", cruds.ModelName(), err),
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
	cruds RecordsSearch[User, Model, Read],
	query types_.SearchQuery,
) (int64, error) {
	qb := cruds.GetModel(ctx)

	// Apply where filters
	if len(query.Where) > 0 {
		var err error
		qb, err = ApplyWhere(qb, query.Where, cruds.MapWhere)
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
	cruds RecordsSearch[User, Model, Read],
	query types_.SearchQuery,
	user *User,
	process bool,
	workers int,
) ([]Read, error) {
	// Force default select for full Model
	query.Select = cruds.DefaultSelect()

	// Apply defaults
	if len(query.OrderBy) == 0 {
		query.OrderBy = cruds.DefaultOrderBy()
	}
	if query.Page == 0 {
		query.Page = 1
	}
	if query.Size == 0 {
		query.Size = cruds.MaxItemsPerPage()
	}

	// Apply auth filter if user provided
	if user != nil {
		query = cruds.AuthGet(ctx, *user, query)
	}

	// Build query
	qb, err := BuildSelectQuery(ctx, cruds, query)
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
		results[i] = cruds.ToRead(&model)
	}

	// Step 6: Post-process if requested
	if process {
		processed, err := utils.BatchProcessWithSemaphore(
			results,
			func(item Read) (Read, error) {
				err := cruds.PostProcess(ctx, &item)
				return item, err
			},
			workers,
		)
		if err != nil {
			return nil, err
		}
		results = processed
	}

	return results, nil
}

func GetManyPartial[User any, Model BaseModelReader, Read any](
	ctx context.Context,
	cruds RecordsSearch[User, Model, Read],
	query types_.SearchQuery,
	user *User,
	process bool,
	workers int,
) ([]map[string]any, error) {
	// Apply defaults
	if len(query.Select) == 0 {
		query.Select = cruds.DefaultSelect()
	}
	if len(query.OrderBy) == 0 {
		query.OrderBy = cruds.DefaultOrderBy()
	}
	if query.Page == 0 {
		query.Page = 1
	}
	if query.Size == 0 {
		query.Size = cruds.MaxItemsPerPage()
	}

	// Apply auth filter if user provided
	if user != nil {
		query = cruds.AuthGet(ctx, *user, query)
	}

	// Build query
	qb, err := BuildSelectQuery(ctx, cruds, query)
	if err != nil {
		return nil, err
	}

	// Execute query
	var models []Model
	err = qb.Find(&models).Error
	if err != nil {
		return nil, err
	}

	// Convert to map
	results := make([]map[string]any, len(models))
	finalFields := GetSelectedFields(query.Select, cruds.MapSelect)
	for i, model := range models {
		partial, err := cruds.ToJSON(model, finalFields)
		if err != nil {
			return results, err
		}
		results[i] = partial
	}

	// Step 6: Post-process if requested
	if process {
		processed, err := utils.BatchProcessWithSemaphore(
			results,
			func(item map[string]any) (map[string]any, error) {
				err := cruds.PostProcessPartial(ctx, item)
				return item, err
			},
			workers,
		)
		if err != nil {
			return nil, err
		}
		results = processed
	}

	return results, nil
}

func Paginate[User any, Model BaseModelReader, Read any](
	ctx context.Context,
	cruds RecordsSearch[User, Model, Read],
	query types_.SearchQuery,
	user *User,
	process bool,
	workers int,
) (types_.PaginatedDict, error) {
	var zero types_.PaginatedDict

	// Step 1: Apply auth filter if user provided
	if user != nil {
		query = cruds.AuthGet(ctx, *user, query)
	}

	// Step 2: Count total results
	totalCount, err := Count(ctx, cruds, query)
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
		size = cruds.MaxItemsPerPage()
	}
	totalPages := (int(totalCount) + size - 1) / size

	// Step 4: Normalize query
	query.Page = page
	query.Size = size

	// Step 5: Fetch results (without auth since already applied)
	data, err := GetManyPartial(ctx, cruds, query, nil, process, workers)
	if err != nil {
		return zero, err
	}

	// Step 6: Return paginated result
	return types_.PaginatedDict{
		Page:       page,
		TotalPages: totalPages,
		TotalCount: int(totalCount),
		Data:       data,
	}, nil
}
