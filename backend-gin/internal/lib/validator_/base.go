package validator_

import (
	"strings"

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
}
