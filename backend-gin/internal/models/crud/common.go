package crud

import (
	"backend/internal/lib/types_"
	"encoding/json"
	"fmt"
	"net/http"

	"go.mongodb.org/mongo-driver/bson"
)

func NotFoundErr(collection string, filters bson.M) error {
	filtersJSON, _ := json.Marshal(filters)
	return types_.APIError{
		Code: http.StatusNotFound,
		Message: fmt.Sprintf(
			"no %s document found with following criteria: %s",
			collection, string(filtersJSON),
		),
	}
}
