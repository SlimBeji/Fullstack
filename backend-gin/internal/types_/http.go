package types_

import "go.mongodb.org/mongo-driver/bson"

type RecordsPaginated[T any] struct {
	Page       int `json:"page"`
	TotalPages int `json:"totalPages"`
	TotalCount int `json:"totalCount"`
	Data       []T `json:"data"`
}

type DataPaginated struct {
	Page       int      `json:"page"`
	TotalPages int      `json:"totalPages"`
	TotalCount int      `json:"totalCount"`
	Data       []bson.M `json:"data"`
}
