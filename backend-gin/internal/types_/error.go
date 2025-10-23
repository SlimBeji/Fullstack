package types_

import (
	"encoding/json"
	"fmt"
	"net/http"

	"go.mongodb.org/mongo-driver/bson"
)

type ApiError struct {
	Code    int
	Message string
	Err     error
}

func (ae ApiError) Error() string {
	if ae.Err != nil {
		return fmt.Sprintf("API %d Error: %s - %v", ae.Code, ae.Message, ae.Err)
	}
	return fmt.Sprintf("API %d Error: %s", ae.Code, ae.Message)
}

func (ae ApiError) Unwrap() error {
	return ae.Err
}

func NotAuthenticatedErr() error {
	return ApiError{
		Code:    http.StatusUnauthorized,
		Message: "not Authenticated",
	}
}

func AccessDeiniedErr(collection string, id string) error {
	return ApiError{
		Code:    http.StatusUnauthorized,
		Message: fmt.Sprintf("access to %s document %s denied", collection, id),
	}
}

func NotFoundErr(collection string, filters bson.M) error {
	filtersJSON, _ := json.Marshal(filters)
	return ApiError{
		Code: http.StatusNotFound,
		Message: fmt.Sprintf(
			"no %s document found with following criteria: %s",
			collection, string(filtersJSON),
		),
	}
}

func IdNotFoundErr(collection string, id string) error {
	return ApiError{
		Code:    http.StatusNotFound,
		Message: fmt.Sprintf("%s document %s not found", collection, id),
	}
}

func UnprocessableErr(message string, err error) error {
	return ApiError{
		Code:    http.StatusUnprocessableEntity,
		Message: message,
		Err:     err,
	}
}
