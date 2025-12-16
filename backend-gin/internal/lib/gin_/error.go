package gin_

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"go.mongodb.org/mongo-driver/bson"
)

type ApiError struct {
	Code    int
	Message string
	Details map[string]any
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

func NotAdminErr(err error) error {
	return ApiError{
		Code:    http.StatusUnauthorized,
		Message: "not an admin!",
		Err:     err,
	}
}

func UnprocessableErr(message string, err error) error {
	return ApiError{
		Code:    http.StatusUnprocessableEntity,
		Message: message,
		Err:     err,
	}
}

func ValidationErrs(message string, errMessages []string) error {
	merged := strings.Join(errMessages, "\n")
	err := errors.New(merged)
	return ApiError{
		Code:    http.StatusUnprocessableEntity,
		Message: message,
		Err:     err,
		Details: map[string]any{"errs": errMessages},
	}
}
