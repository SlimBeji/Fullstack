package middlewares

import (
	"backend/internal/lib/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

func BodyExtractor[T any](c *gin.Context) {
	var form T
	var err error

	if utils.IsMultipart(c) {
		err = c.ShouldBind(&form)
	} else {
		err = c.ShouldBindJSON(&form)
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
	errs := utils.ValidateStruct(&form)
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
