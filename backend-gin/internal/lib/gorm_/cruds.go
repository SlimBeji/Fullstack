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

// Read Helpers

type RecordRead[User any, Model BaseModelReader, Read any] interface {
	QueryBuilder
	ModelName() string
	DefaultSelect() []string
	AuthGet(context.Context, User, types_.SearchQuery) types_.SearchQuery
	ToRead(*Model) Read
	ToJSON(map[string]any) error
	PostProcess(context.Context, *Read) error
	PostProcessPartial(context.Context, map[string]any) error
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

func getRaw[User any, Model BaseModelReader, Read any](
	ctx context.Context, crud RecordRead[User, Model, Read], id uint, user *User,
) (Model, error) {
	var zero Model

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
		query = crud.AuthGet(ctx, *user, query)
	}

	// Build and execute query
	qb, err := BuildSelectQuery(ctx, crud, query)
	if err != nil {
		return zero, err
	}

	var model Model
	err = qb.First(&model).Error
	return model, err
}

func Get[User any, Model BaseModelReader, Read any](
	ctx context.Context, crud RecordRead[User, Model, Read], id uint, user *User,
) (Read, error) {
	var zero Read
	model, err := getRaw(ctx, crud, id, user)
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
		query = crud.AuthGet(ctx, *user, query)
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

	if err := crud.ToJSON(result); err != nil {
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
	HooksData any,
	Post any,
] interface {
	RecordRead[User, Model, Read]
	ToModel(Create) Model
	PostToCreate(context.Context, Post) (Create, error)
	AuthPost(context.Context, User, Post) error
	BeforeCreate(*gorm.DB, Create) (HooksData, error)
	AfterCreate(*gorm.DB, uint, Create, HooksData) error
}

func CreateRecord[User any, Model BaseModelReader, Read any, Create any, HooksData any, Post any](
	ctx context.Context,
	crud RecordCreate[User, Model, Read, Create, HooksData, Post],
	data Create,
) (uint, error) {
	var createdID uint

	err := crud.GetDB(ctx).Transaction(func(tx *gorm.DB) error {
		// Convert Create to Model
		entity := crud.ToModel(data)

		// Before create hook
		hooksData, err := crud.BeforeCreate(tx, data)
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
		if err := crud.AfterCreate(tx, createdID, data, hooksData); err != nil {
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

func PostRecord[User any, Model BaseModelReader, Read any, Create any, HooksData any, Post any](
	ctx context.Context,
	crud RecordCreate[User, Model, Read, Create, HooksData, Post],
	form Post,
	user *User,
) (uint, error) {
	if user != nil {
		err := crud.AuthPost(ctx, *user, form)
		if err != nil {
			return 0, err
		}
	}

	data, err := crud.PostToCreate(ctx, form)
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
	crud RecordUpdate[User, Model, Read, Update, HooksData, Put],
	id uint,
	data Update,
) error {
	err := crud.GetDB(ctx).Transaction(func(tx *gorm.DB) error {
		// Before update hook
		hooksData, err := crud.BeforeUpdate(tx, id, data)
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
			return types_.NotFoundError(crud.ModelName(), id)
		}

		// After update hook
		if err := crud.AfterUpdate(tx, id, data, hooksData); err != nil {
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

func PutRecord[User any, Model BaseModelReader, Read any, Update any, HooksData any, Put any](
	ctx context.Context,
	crud RecordUpdate[User, Model, Read, Update, HooksData, Put],
	id uint,
	form Put,
	user *User,
) error {
	if user != nil {
		err := crud.AuthPut(ctx, *user, id, form)
		if err != nil {
			return err
		}
	}

	data, err := crud.PutToUpdate(ctx, form)
	if err != nil {
		return err
	}

	return UpdateRecord(ctx, crud, id, data)
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
	crud RecordDelete[User, Model, Read, HooksData],
	id uint,
	user *User,
) error {
	// Check authoriztion
	if user != nil {
		if err := crud.AuthDelete(ctx, *user, id); err != nil {
			return err
		}
	}

	err := crud.GetDB(ctx).Transaction(func(tx *gorm.DB) error {
		// Before delete hook
		hooksData, err := crud.BeforeDelete(tx, id)
		if err != nil {
			return err
		}

		// Delete from database
		var model Model
		result := tx.Delete(&model, id) // How to delete record by id ??
		if result.Error != nil {
			return result.Error
		}

		// After delete hook
		if err := crud.AfterDelete(tx, id, hooksData); err != nil {
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
		query = crud.AuthGet(ctx, *user, query)
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
		query = crud.AuthGet(ctx, *user, query)
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

	for _, result := range results {
		if err := crud.ToJSON(result); err != nil {
			return results, nil
		}
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
		query = crud.AuthGet(ctx, *user, query)
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
				err := crud.PostProcessPartial(ctx, item)
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
