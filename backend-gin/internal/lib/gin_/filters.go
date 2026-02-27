package gin_

import (
	"backend/internal/lib/types_"
	"backend/internal/lib/utils"
	"backend/internal/lib/validator_"
	"strings"

	"github.com/gin-gonic/gin"
)

func QueryFilters[T types_.SearchQueryReader](c *gin.Context) {
	var data T
	queryParams := c.Request.URL.Query()

	// Convert the params to a map[string]any
	paramsMap := make(map[string]any)
	for key, values := range queryParams {
		switch key {
		case "page", "size":
			paramsMap[key] = values[0]
		case "sort", "fields":
			paramsMap[key] = strings.Split(values[0], ",")
		default:
			// Filter fields here, use QueryArray because we can get multiple values
			// e.g. ?age=gte:20&age=lte:40
			paramsMap[key] = c.QueryArray(key)
		}
	}

	// Try to decode the raw map to a body
	if err := utils.SmartDecode(paramsMap, &data); err != nil {
		// Failed to serialize
		apiErr := types_.SerializationErr(err)
		AbortWithStatusJSON(c, apiErr)
		return
	}

	// Validate the data
	msgs := validator_.ValidateStruct(&data)
	if len(msgs) > 0 {
		apiErr := types_.ValidationErrs("search query not valid", msgs)
		AbortWithStatusJSON(c, apiErr)
		return
	}

	// Convert filters schema to a SearchQuey
	parsed, err := data.ToSearchQuery()
	if err != nil {
		AbortWithStatusJSON(c, err)
		return
	}

	// Store the parsed form in context for later use
	c.Set("parsedSearchQuery", parsed)
	c.Next()
}

func BodyFilters[T types_.SearchQueryReader](c *gin.Context) {
	var body T

	err := c.ShouldBindJSON(&body)
	if err != nil {
		// Failed to serialize
		apiErr := types_.SerializationErr(err)
		AbortWithStatusJSON(c, apiErr)
		return
	}

	// Validate the data
	msgs := validator_.ValidateStruct(&body)
	if len(msgs) > 0 {
		apiErr := types_.ValidationErrs("search query not valid", msgs)
		AbortWithStatusJSON(c, apiErr)
		return
	}

	// Convert filters schema to a SearchQuey
	parsed, err := body.ToSearchQuery()
	if err != nil {
		AbortWithStatusJSON(c, err)
		return
	}

	// Store the parsed form in context for later use
	c.Set("parsedSearchQuery", parsed)
	c.Next()
}
