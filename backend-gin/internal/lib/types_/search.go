package types_

import "fmt"

type SearchQuery struct {
	Page    int
	Size    int
	OrderBy []string
	Select  []string
	Where   WhereFilters
}

type SearchQueryReader interface {
	ToSearchQuery() (SearchQuery, error)
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
