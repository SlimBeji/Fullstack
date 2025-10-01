package schemas

import (
	"backend/internal/models/fields"
	"encoding/json"
	"fmt"
	"reflect"

	"github.com/go-playground/validator/v10"
)

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

// //////// Build schemas for map values //////////////
func BuildStructFromJson[T any](b []byte, validate bool) (T, []ValidationError) {
	var result T
	var errs []ValidationError
	err := json.Unmarshal(b, &result)
	if err != nil {
		errs = append(errs, ValidationError{"data", err.Error()})
		return result, errs
	}
	if validate {
		errs = ValidateSchema(result)
	}
	return result, errs
}

func BuildStructFromMap[T any](data map[string]any, validate bool) (T, []ValidationError) {
	var result T
	var errs []ValidationError

	b, err := json.Marshal(data)
	if err != nil {
		errs = append(errs, ValidationError{"data", err.Error()})
		return result, errs
	}
	return BuildStructFromJson[T](b, validate)
}
