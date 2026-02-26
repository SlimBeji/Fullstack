package types_

import (
	"errors"
	"fmt"
)

type FilterOp string

const DefaultMaxSize = 100

const (
	FilterEq    FilterOp = "eq"
	FilterNe    FilterOp = "ne"
	FilterNull  FilterOp = "null"
	FilterIn    FilterOp = "in"
	FilterNin   FilterOp = "nin"
	FilterLt    FilterOp = "lt"
	FilterLte   FilterOp = "lte"
	FilterGt    FilterOp = "gt"
	FilterGte   FilterOp = "gte"
	FilterLike  FilterOp = "like"
	FilterIlike FilterOp = "ilike"
)

func (op FilterOp) IsValid() bool {
	switch op {
	case FilterEq, FilterNe, FilterNull, FilterIn, FilterNin,
		FilterLt, FilterLte, FilterGt, FilterGte,
		FilterLike, FilterIlike:
		return true
	default:
		return false
	}
}

type Filter struct {
	Op  FilterOp
	Val any
}

func NewFilter(op FilterOp, val any) Filter {
	return Filter{Op: op, Val: val}
}

func (f *Filter) Validate() error {
	if !f.Op.IsValid() {
		return fmt.Errorf("invalid filter operation: %s", f.Op)
	}

	// Validate Val based on Op
	switch f.Op {
	case FilterNull:
		if _, ok := f.Val.(bool); !ok {
			return fmt.Errorf("null operator takes only boolean values, received %s instead", f.Val)
		}
	case FilterIn, FilterNin:
		// Should be a slice
		if _, ok := f.Val.([]any); !ok {
			return fmt.Errorf("%s operator requires array value", f.Op)
		}
	default:
		if f.Val == nil {
			return fmt.Errorf("%s requires non-nil value", f.Op)
		}
	}

	return nil
}

func EqFilters(val any) []Filter {
	return []Filter{NewFilter(FilterEq, val)}
}

func InFilters(val any) []Filter {
	return []Filter{NewFilter(FilterIn, val)}
}

type WhereFilters map[string][]Filter

func (wf WhereFilters) Validate() error {
	var errs []error
	for field, filters := range wf {
		for i, filter := range filters {
			if err := filter.Validate(); err != nil {
				errs = append(errs, fmt.Errorf("field %q filter[%d]: %w", field, i, err))
			}
		}
	}
	return errors.Join(errs...)
}

type SearchQuery struct {
	Page    int
	Size    int
	OrderBy []string
	Select  []string
	Where   WhereFilters
}

func NewSearchQuery() *SearchQuery {
	return &SearchQuery{
		Page:    1,
		Size:    DefaultMaxSize,
		OrderBy: []string{},
		Select:  []string{},
		Where:   make(WhereFilters),
	}
}

func (sq *SearchQuery) Validate() error {
	if sq.Page < 1 {
		return fmt.Errorf("page must be >= 1")
	}
	if sq.Size < 1 || sq.Size > DefaultMaxSize {
		return fmt.Errorf("size must be between 1 and %d", DefaultMaxSize)
	}

	if err := sq.Where.Validate(); err != nil {
		return err
	}

	return nil
}
