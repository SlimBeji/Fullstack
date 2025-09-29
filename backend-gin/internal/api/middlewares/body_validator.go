package middlewares

import (
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

func BodyExtractor(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	fmt.Println(string(body))
	c.Set("requestBody", body)
	c.Next()
}
