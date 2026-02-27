package types_

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"go.mongodb.org/mongo-driver/bson"
)

type APIError struct {
	Code    int
	Message string
	Details map[string]any
	Err     error
}

func (ae APIError) Error() string {
	if ae.Err != nil {
		return fmt.Sprintf("API %d Error: %s - %v", ae.Code, ae.Message, ae.Err)
	}
	return fmt.Sprintf("API %d Error: %s", ae.Code, ae.Message)
}

func (ae APIError) Unwrap() error {
	return ae.Err
}

func NotAuthenticatedErr() error {
	return APIError{
		Code:    http.StatusUnauthorized,
		Message: "not authenticated",
	}
}

func AccessDeniedErr(collection string, id string) error {
	return APIError{
		Code:    http.StatusForbidden,
		Message: fmt.Sprintf("access to %s document %s denied", collection, id),
	}
}

func NotFoundErr(collection string, filters bson.M) error {
	filtersJSON, _ := json.Marshal(filters)
	return APIError{
		Code: http.StatusNotFound,
		Message: fmt.Sprintf(
			"no %s document found with following criteria: %s",
			collection, string(filtersJSON),
		),
	}
}

func IdNotFoundErr(collection string, id string) error {
	return APIError{
		Code:    http.StatusNotFound,
		Message: fmt.Sprintf("%s document %s not found", collection, id),
	}
}

func NotAdminErr(err error) error {
	return APIError{
		Code:    http.StatusUnauthorized,
		Message: "not an admin",
		Err:     err,
	}
}

func SerializationErr(err error) error {
	return APIError{
		Code:    http.StatusBadRequest,
		Message: "failed to serialize request",
		Err:     err,
	}
}

func StringsToSerializationErr(errMessages []string) error {
	merged := strings.Join(errMessages, "\n")
	err := errors.New(merged)
	return APIError{
		Code:    http.StatusBadRequest,
		Message: "failed to serialize request",
		Err:     err,
		Details: map[string]any{"errs": errMessages},
	}
}

func UnprocessableErr(message string, err error) error {
	return APIError{
		Code:    http.StatusUnprocessableEntity,
		Message: message,
		Err:     err,
	}
}

func ValidationErrs(message string, errMessages []string) error {
	merged := strings.Join(errMessages, "\n")
	err := errors.New(merged)
	return APIError{
		Code:    http.StatusUnprocessableEntity,
		Message: message,
		Err:     err,
		Details: map[string]any{"errs": errMessages},
	}
}
