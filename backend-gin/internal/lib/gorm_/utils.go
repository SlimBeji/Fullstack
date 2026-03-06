package gorm_

import (
	"backend/internal/lib/types_"
	"errors"
	"fmt"
	"strings"

	"gorm.io/gorm"
)

// Query Helpers

type QueryBuilder interface {
	GetModel() *gorm.DB
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
	crud QueryBuilder,
	query types_.SearchQuery,
) (*gorm.DB, error) {
	qb := crud.GetModel()

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
	crud QueryBuilder,
	where types_.WhereFilters,
) (bool, error) {
	qb := crud.GetModel()

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
	GetModel() *gorm.DB
	DefaultSelect() []string
	AuthGet(user User, query types_.SearchQuery) types_.SearchQuery
	ToRead(*Model) Read
	PostProcess(*Read) error
	PostProcessPartial(map[string]any) error
}

func Read[User any, Model BaseModelReader, Read any](
	crud RecordRead[User, Model, Read], id int,
) (*Model, error) {
	var result Model
	err := crud.GetModel().First(&result, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Not found
		}
		return nil, err // Database error
	}
	return &result, nil
}

func Get[User any, Model BaseModelReader, Read any](
	crud RecordRead[User, Model, Read], id int, user *User,
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
	qb, err := BuildSelectQuery(crud, query)
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
	crud RecordRead[User, Model, Read],
	id int,
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
	qb, err := BuildSelectQuery(crud, query)
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
	AfterCreate(*gorm.DB, int, Create) error
}
