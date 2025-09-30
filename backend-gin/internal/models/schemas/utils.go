package schemas

import (
	"backend/internal/models/fields"
	"encoding/json"
	"fmt"
	"reflect"

	"github.com/go-playground/validator/v10"
)

// //////// Build schemas for map values //////////////
func BuildStruct[T any](data map[string]any) (T, error) {
	var result T

	b, err := json.Marshal(data)
	if err != nil {
		return result, err
	}

	err = json.Unmarshal(b, &result)
	return result, err
}

////////// Validating Forms and Schemas //////////////

type ValidationError struct {
	Field string `json:"field"`
	Error string `json:"error"`
}

func newSchemaValidator() *validator.Validate {
	v := validator.New()

	v.RegisterCustomTypeFunc(
		func(field reflect.Value) any {
			if field.Kind() == reflect.Struct {
				valField := field.FieldByName("Value")
				if valField.IsValid() {
					return valField.Interface()
				}
			}
			return nil
		},
		fields.SupportedFields...,
	)
	return v
}

func ValidateSchema(s any) []ValidationError {
	validate := newSchemaValidator()
	err := validate.Struct(s)
	if err == nil {
		return nil
	}

	var errs []ValidationError
	for _, e := range err.(validator.ValidationErrors) {
		jsonName := e.Field()
		errs = append(errs, ValidationError{
			Field: jsonName,
			Error: fmt.Sprintf("failed on '%s' rule", e.Tag()),
		})
	}
	return errs
}
