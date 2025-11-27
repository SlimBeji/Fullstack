package types_

import (
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type FilterOp string

const (
	FilterEq     FilterOp = "eq"
	FilterNe     FilterOp = "ne"
	FilterGt     FilterOp = "gt"
	FilterGte    FilterOp = "gte"
	FilterLt     FilterOp = "lt"
	FilterLte    FilterOp = "lte"
	FilterIn     FilterOp = "in"
	FilterNin    FilterOp = "nin"
	FilterRegex  FilterOp = "regex"
	FilterText   FilterOp = "text"
	FilterExists FilterOp = "exists"
)

type Filter struct {
	Op  FilterOp
	Val any
}

type FindQueryFilters map[string][]Filter

type FindQuery struct {
	Page    int
	Size    int
	Sort    []string
	Fields  []string
	Filters FindQueryFilters
}

type MongoFindQuery struct {
	Pagination *Pagination
	Filters    *bson.M
	Sort       *bson.D
	Projection *bson.M
}

type IndexMapping map[Collections][]mongo.IndexModel
