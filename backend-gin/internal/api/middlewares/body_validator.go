package middlewares

import (
	"backend/internal/lib/gin_"
	"backend/internal/lib/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

func extractBody[T any](c *gin.Context) (T, []string) {
	var form T
	var err error

	if gin_.IsMultipart(c) {
		err = c.ShouldBind(&form)
	} else {
		err = c.ShouldBindJSON(&form)
	}
	if err != nil {
		return form, []string{err.Error()}
	}

	errs := utils.ValidateStruct(&form)
	return form, errs
}

func BodyValidator[T any](c *gin.Context) {
	form, errs := extractBody[T](c)
	if len(errs) > 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error":   "Invalid request body",
			"details": errs,
		})
		c.Abort()
		return
	}

	// Store the parsed form in context for later use
	c.Set("requestBody", form)
	c.Next()
}
