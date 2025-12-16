package types_

type PaginatedData[T any] struct {
	Page       int `json:"page"`
	TotalPages int `json:"totalPages"`
	TotalCount int `json:"totalCount"`
	Data       []T `json:"data"`
}

type PaginationData struct {
	Page int
	Size int
}

func (p *PaginationData) Skip() int {
	return (p.Page - 1) * p.Size
}
