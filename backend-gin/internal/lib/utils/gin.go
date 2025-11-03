package utils

import (
	"backend/internal/types_"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func IsMultipart(c *gin.Context) bool {
	contentType := c.GetHeader("Content-Type")
	xxxUrlEncoded := strings.HasPrefix(contentType, string(types_.ContentTypeFormUrlencoded))
	formData := strings.HasPrefix(contentType, string(types_.ContentTypeMultipart))
	return xxxUrlEncoded || formData
}

func GetBody[T any](c *gin.Context) (T, bool) {
	var zero T
	raw, exists := c.Get("requestBody")
	if !exists {
		return zero, false
	}

	body, ok := raw.(T)
	return body, ok
}

func AbortWithStatusJSON(c *gin.Context, err error) {
	apiError, ok := err.(types_.ApiError)
	if !ok {
		resp := gin.H{"error": true, "message": "Internal server error"}
		c.AbortWithStatusJSON(http.StatusInternalServerError, resp)
		return
	}

	resp := gin.H{"error": true, "message": apiError.Message}
	if apiError.Details != nil {
		resp["details"] = apiError.Details
	}
	c.AbortWithStatusJSON(apiError.Code, resp)
}
