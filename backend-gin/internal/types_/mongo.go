package types_

import (
	"backend/internal/lib/types_"

	"go.mongodb.org/mongo-driver/bson"
)

type MongoFindQuery struct {
	Pagination *types_.PaginationData
	Filters    *bson.M
	Sort       *bson.D
	Projection *bson.M
}
