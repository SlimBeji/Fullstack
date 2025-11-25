package utils

import (
	"strings"

	"github.com/go-playground/locales/en"
	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	en_translations "github.com/go-playground/validator/v10/translations/en"
)

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
		return result
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

var ErrorTranslator ut.Translator
var Validate *validator.Validate

func init() {
	// Initialize the Error Translator
	translator := en.New()
	uni := ut.New(translator, translator)
	ErrorTranslator, _ = uni.GetTranslator("en")

	// Initialize the main validator
	Validate = GetBaseValidator()
}
