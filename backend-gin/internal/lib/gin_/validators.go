package gin_

import (
	"backend/internal/lib/types_"
	"backend/internal/lib/validator_"
	"net/http"

	"github.com/gin-gonic/gin"
)

func ExtractBody[T any](c *gin.Context) (T, []string) {
	var form T
	var err error

	if IsMultipart(c) {
		err = c.ShouldBind(&form)
	} else {
		err = c.ShouldBindJSON(&form)
	}
	if err != nil {
		return form, []string{err.Error()}
	}

	errs := validator_.ValidateStruct(&form)
	return form, errs
}

func BodyValidator[T any](c *gin.Context) {
	form, errs := ExtractBody[T](c)
	if len(errs) > 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error":   "invalid request body",
			"details": errs,
		})
		c.Abort()
		return
	}

	// Store the parsed form in context for later use
	c.Set("parsedBody", form)
	c.Next()
}

type QueryForm[T any] interface {
	FromRequest(c *gin.Context) (T, []string)
}

func QueryValidator[T QueryForm[T]](c *gin.Context) {
	var form T

	// Extract the form
	form, errs := form.FromRequest(c)
	if len(errs) > 0 {
		apiErr := types_.StringsToSerializationErr(errs)
		AbortWithStatusJSON(c, apiErr)
		return
	}

	// Validate the data
	msgs := validator_.ValidateStruct(&form)
	if len(msgs) > 0 {
		apiErr := types_.ValidationErrs("request query not valid", msgs)
		AbortWithStatusJSON(c, apiErr)
		return
	}

	// Store the parsed form in context for later use
	c.Set("parsedQuery", form)
	c.Next()
}
