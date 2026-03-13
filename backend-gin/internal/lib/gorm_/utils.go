package gorm_

import (
	"backend/internal/lib/types_"
	"context"
	"fmt"
	"sort"
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
	selectionLoadMap := make(map[string]SelectionLoad)

	// Collect all SelectFields and all SelectionLoads
	for _, clause := range clauses {
		selectFields := mapFunc(clause)
		for _, sf := range selectFields {
			if sf.Level == 0 {
				// This field is on the main table
				selectSet[sf.Field] = true
			} else {
				// This field is on a child/grandchild table
				selectionLoad, found := selectionLoadMap[sf.Preload]
				if !found {
					// First time adding the selection load for this relation
					selectionLoad = SelectionLoad{
						Preload: sf.Preload,
						Level:   sf.Level,
						Fields:  []string{sf.Field},
					}
					selectionLoadMap[sf.Preload] = selectionLoad
				} else {
					// Relation was already added, append field if not duplicate
					fieldExists := false
					for _, f := range selectionLoad.Fields {
						if f == sf.Field {
							fieldExists = true
							break
						}
					}
					if !fieldExists {
						selectionLoad.Fields = append(selectionLoad.Fields, sf.Field)
						selectionLoadMap[sf.Preload] = selectionLoad
					}
				}
			}
		}
	}

	// Apply select to main columns
	selectFields := make([]string, 0, len(selectSet))
	for field := range selectSet {
		selectFields = append(selectFields, field)
	}
	db = db.Select(selectFields)

	// Sort selectionLoads by level
	selectionLoads := make([]SelectionLoad, 0, len(selectionLoadMap))
	for _, sl := range selectionLoadMap {
		selectionLoads = append(selectionLoads, sl)
	}
	sort.Slice(selectionLoads, func(i, j int) bool {
		return selectionLoads[i].Level < selectionLoads[j].Level
	})

	// Apply preloads in order (shallow to deep)
	for _, sl := range selectionLoads {
		db = db.Preload(sl.Preload, func(db *gorm.DB) *gorm.DB {
			return db.Select(sl.Fields)
		})
	}

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
