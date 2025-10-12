package middlewares

import (
	"backend/internal/lib/utils"
	"backend/internal/types_"
	"net/http"
	"reflect"

	"github.com/gin-gonic/gin"
)

func BodyExtractor(form any) gin.HandlerFunc {
	// Get the type of the form to create inside the request handler
	formType := reflect.TypeOf(form)
	if formType.Kind() == reflect.Pointer {
		formType = formType.Elem()
	} else {
		panic("BodyExtractor needs a struct pointer")
	}

	return func(c *gin.Context) {
		var err error
		contentType := c.GetHeader("Content-Type")
		newForm := reflect.New(formType).Interface()

		switch types_.ContentType(contentType) {
		case types_.CONTENT_TYPE_MULTIPART, types_.CONTENT_TYPE_FORM_URLENCODED:
			err = c.ShouldBind(newForm)
		default:
			err = c.ShouldBindJSON(newForm)
		}

		// return bad request if could not do the bind
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Bad request",
				"details": err.Error(),
			})
			c.Abort()
			return
		}

		// Validate the data
		errs := utils.ValidateStruct(newForm)
		if len(errs) > 0 {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"error":   "Invalid request body",
				"details": errs,
			})
			c.Abort()
			return
		}

		// Store the parsed form in context for later use
		c.Set("requestBody", newForm)
		c.Next()
	}
}
