package types_

type Pagination struct {
	Page int
	Size int
}

func (p *Pagination) Skip() int {
	return (p.Page - 1) * p.Size
}

type RecordsPaginated[T any] struct {
	Page       int `json:"page"`
	TotalPages int `json:"totalPages"`
	TotalCount int `json:"totalCount"`
	Data       []T `json:"data"`
}
