package gin_

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func LimitRequestBody(maxSize int) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, int64(maxSize))
		c.Next()
	}
}
