package validator_

import (
	"fmt"
	"reflect"
	"slices"
	"strings"

	"github.com/creasty/defaults"
	"github.com/go-playground/locales/en"
	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	en_translations "github.com/go-playground/validator/v10/translations/en"
)

// ErrorTranslator translates validation errors to English
var ErrorTranslator ut.Translator

// Validate is the global validator instance
var Validate *validator.Validate

func GetBaseValidator() *validator.Validate {
	validate := validator.New()
	en_translations.RegisterDefaultTranslations(validate, ErrorTranslator)
	return validate
}

func TranslateErrors(err error) []string {
	var result []string
	if err == nil {
		return result
	}

	errs, ok := err.(validator.ValidationErrors)
	if !ok {
		return []string{err.Error()}
	}

	for _, e := range errs {
		result = append(result, e.Translate(ErrorTranslator))
	}
	return result
}

func ValidateStruct(form any) []string {
	if err := defaults.Set(form); err != nil {
		return []string{"Failed to set default values"}
	}
	err := Validate.Struct(form)
	return TranslateErrors(err)
}

func ValidateVar(val any, tag string) string {
	if tag == "" {
		return ""
	}

	err := Validate.Var(val, tag)
	translated := TranslateErrors(err)
	if len(translated) == 0 {
		return ""
	}
	return strings.TrimSpace(translated[0])
}

// Add custom validators here

func RegisterOneofOrNone(v *validator.Validate) error {
	err := v.RegisterValidation("oneofornone", func(fl validator.FieldLevel) bool {
		field := fl.Field()

		// field should be a string
		if field.Kind() != reflect.String {
			return false
		}

		// Empty is always valid
		if field.Len() == 0 {
			return true
		}

		// Not empty - validate each item
		param := fl.Param()
		value := field.String()
		allowed := strings.Fields(param)
		return slices.Contains(allowed, value)
	})
	if err != nil {
		return err
	}

	return v.RegisterTranslation("oneofornone", ErrorTranslator,
		func(ut ut.Translator) error {
			return ut.Add("oneofornone", "{0} must be one of {1} or empty", true)
		},
		func(ut ut.Translator, fe validator.FieldError) string {
			t, _ := ut.T("oneofornone", fe.Field(), fe.Param())
			return t
		},
	)
}

func init() {
	// Initialize the Error Translator
	var found bool
	translator := en.New()
	uni := ut.New(translator, translator)
	ErrorTranslator, found = uni.GetTranslator("en")
	if !found {
		panic("failed to get English translator")
	}

	// Initialize the main validator
	Validate = GetBaseValidator()

	// Register custom validators
	err := RegisterOneofOrNone(Validate)
	if err != nil {
		message := fmt.Sprintf("could not register oneofornone validation rule: %s", err)
		panic(message)
	}
}
