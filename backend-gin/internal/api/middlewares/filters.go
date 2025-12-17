package middlewares

import (
	"backend/internal/config"
	"backend/internal/lib/types_"
	"backend/internal/lib/validator_"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-viper/mapstructure/v2"
)

func smartDecode(in map[string]any, out any) error {
	// using WeaklyTypedInput for easy int conversion like "1"->1
	decoderConfig := &mapstructure.DecoderConfig{
		Result:           out,
		TagName:          "json",
		WeaklyTypedInput: true,
	}

	decoder, err := mapstructure.NewDecoder(decoderConfig)
	if err != nil {
		return err
	}

	if err := decoder.Decode(in); err != nil {
		return err
	}

	return nil
}

func queryParamsToBody[T any](c *gin.Context) (T, []string) {
	var body T

	queryParams := c.Request.URL.Query()
	paramsMap := make(map[string]any)
	for key, values := range queryParams {
		switch key {
		case "page", "size":
			paramsMap[key] = values[0]
		case "sort", "fields":
			paramsMap[key] = strings.Split(values[0], ",")
		default:
			// Filter fields here
			paramsMap[key] = c.QueryArray(key)
		}
	}

	if err := smartDecode(paramsMap, &body); err != nil {
		return body, []string{err.Error()}
	}

	return body, nil
}

func Filter[T any](c *gin.Context) {
	var body T
	var errs []string

	if c.Request.Method == http.MethodGet {
		body, errs = queryParamsToBody[T](c)
	} else {
		body, errs = extractBody[T](c)
	}

	if len(errs) > 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error":   "Invalid request body",
			"details": errs,
		})
		c.Abort()
		return
	}

	form := types_.FindQuery{}
	errsMap := validator_.BuildFindQuery(body, &form, config.Env.MaxItemsPerPage)
	if len(errsMap) > 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error":   "Invalid request",
			"details": errsMap,
		})
		c.Abort()
		return
	}

	// Store the parsed form in context for later use
	c.Set("requestBody", form)
	c.Next()
}
