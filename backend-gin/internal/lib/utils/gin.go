package utils

import (
	"backend/internal/types_"
	"strings"

	"github.com/gin-gonic/gin"
)

func IsMultipart(c *gin.Context) bool {
	contentType := c.GetHeader("Content-Type")
	xxxUrlEncoded := strings.HasPrefix(contentType, string(types_.CONTENT_TYPE_FORM_URLENCODED))
	formData := strings.HasPrefix(contentType, string(types_.CONTENT_TYPE_MULTIPART))
	return xxxUrlEncoded || formData
}
