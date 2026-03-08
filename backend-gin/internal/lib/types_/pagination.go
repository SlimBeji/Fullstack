package types_

type PaginatedData[T any] struct {
	Page       int `json:"page" example:"1"`
	TotalPages int `json:"totalPages" example:"2"`
	TotalCount int `json:"totalCount" example:"40"`
	Data       []T `json:"data"`
}

type PaginatedDict = PaginatedData[map[string]any]

type PaginationData struct {
	Page int
	Size int
}

func (p *PaginationData) Skip() int {
	return (p.Page - 1) * p.Size
}
