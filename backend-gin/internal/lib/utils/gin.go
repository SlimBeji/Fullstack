package utils

import (
	"backend/internal/types_"
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
