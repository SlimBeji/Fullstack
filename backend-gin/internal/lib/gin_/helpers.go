package gin_

import (
	"backend/internal/lib/types_"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

func ExtractId(c *gin.Context, name string) (uint, error) {
	raw := c.Param(name)
	id, err := strconv.ParseUint(raw, 10, 32)
	if err != nil {
		return 0, types_.APIError{
			Code:    http.StatusBadRequest,
			Message: fmt.Sprintf("%s is not a valid id", raw),
		}
	}
	return uint(id), nil
}

func IsMultipart(c *gin.Context) bool {
	contentType := c.GetHeader("Content-Type")
	isFormUrlEncoded := strings.HasPrefix(contentType, string(types_.ContentTypeFormUrlencoded))
	isMultipart := strings.HasPrefix(contentType, string(types_.ContentTypeMultipart))
	return isFormUrlEncoded || isMultipart
}

func GetBody[T any](c *gin.Context) (T, bool) {
	var zero T
	raw, exists := c.Get("parsedBody")
	if !exists {
		return zero, false
	}

	body, ok := raw.(T)
	return body, ok
}

func GetQuery[T any](c *gin.Context) (T, bool) {
	var zero T
	raw, exists := c.Get("parsedQuery")
	if !exists {
		return zero, false
	}

	body, ok := raw.(T)
	return body, ok
}

func GetSearchQuery(c *gin.Context) (types_.SearchQuery, bool) {
	var zero types_.SearchQuery
	raw, exists := c.Get("parsedSearchQuery")
	if !exists {
		return zero, false
	}
	searchQuery, ok := raw.(types_.SearchQuery)
	return searchQuery, ok
}

func AbortWithStatusJSON(c *gin.Context, err error) {
	var apiError types_.APIError
	if !errors.As(err, &apiError) {
		resp := gin.H{"error": true, "message": "internal server error"}
		log.Println(err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, resp)
		return
	}

	resp := gin.H{"error": true, "message": apiError.Message}
	if apiError.Details != nil {
		resp["details"] = apiError.Details
	}
	c.AbortWithStatusJSON(apiError.Code, resp)
}
