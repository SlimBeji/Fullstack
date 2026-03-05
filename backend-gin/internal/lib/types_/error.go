package types_

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
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

func AccessDeniedErr(modelname string, id int) error {
	return APIError{
		Code:    http.StatusForbidden,
		Message: fmt.Sprintf("access to %s record with id %d denied", modelname, id),
	}
}

func NotFoundError(modelname string, id int) error {
	return APIError{
		Code:    http.StatusNotFound,
		Message: fmt.Sprintf("No record with id %d found in %s", id, modelname),
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

func MapToValidationErrs(message string, mapErrs map[string][]string) error {
	if message == "" {
		message = "form not valid"
	}

	details := make(map[string]any)
	for k, v := range mapErrs {
		details[k] = v
	}

	return APIError{
		Code:    http.StatusUnprocessableEntity,
		Message: message,
		Details: details,
	}
}
