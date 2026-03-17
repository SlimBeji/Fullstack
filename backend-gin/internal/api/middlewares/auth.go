package middlewares

import (
	"backend/internal/lib/gin_"
	"backend/internal/lib/types_"
	"backend/internal/models/cruds"
	"backend/internal/models/schemas"
	"net/http"
	"regexp"

	"github.com/gin-gonic/gin"
)

func GetUserFromToken(c *gin.Context, token string) (schemas.UserRead, error) {
	payload, err := schemas.TokenPayloadFromString(token)
	if err != nil {
		return schemas.UserRead{}, err
	}

	cu := cruds.GetCRUDSUser()
	user, err := cu.GetCache(c, payload.UserId)
	if err != nil {
		return schemas.UserRead{}, types_.APIError{
			Code:    http.StatusNotFound,
			Message: "user not found",
			Err:     err,
		}
	}

	if user.Email != payload.Email {
		return schemas.UserRead{}, types_.APIError{
			Code:    http.StatusBadRequest,
			Message: "Invalid token, payload corrupted",
		}
	}

	return user, nil
}

func checkAuthToken(checkAdmin bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.Request.Header.Get("Authorization")
		if token == "" {
			err := types_.APIError{
				Code:    http.StatusUnauthorized,
				Message: "Not authenticated",
			}
			gin_.AbortWithStatusJSON(c, err)
			return
		}

		re := regexp.MustCompile(`^Bearer\s+(.+)$`)
		match := re.FindStringSubmatch(token)
		if len(match) < 2 {
			err := types_.APIError{
				Code:    http.StatusUnauthorized,
				Message: "No bearer token found",
			}
			gin_.AbortWithStatusJSON(c, err)
			return
		}
		authtoken := match[1]
		user, err := GetUserFromToken(c, authtoken)
		if err != nil {
			gin_.AbortWithStatusJSON(c, err)
			return
		}

		if checkAdmin && !user.IsAdmin {
			err := types_.APIError{
				Code:    http.StatusUnauthorized,
				Message: "Not an admin",
			}
			gin_.AbortWithStatusJSON(c, err)
			return
		}

		c.Set("currentUser", user)
		c.Next()
	}
}

var Authenticated = checkAuthToken(false)

var Admin = checkAuthToken(true)
