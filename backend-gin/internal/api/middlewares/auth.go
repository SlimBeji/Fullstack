package middlewares

import (
	"backend/internal/api/auth"
	"backend/internal/lib/gin_"
	"net/http"
	"regexp"

	"github.com/gin-gonic/gin"
)

func checkAuthToken(checkAdmin bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.Request.Header.Get("Authorization")
		if token == "" {
			err := gin_.ApiError{
				Code:    http.StatusUnauthorized,
				Message: "Not authenticated",
			}
			gin_.AbortWithStatusJSON(c, err)
			return
		}

		re := regexp.MustCompile(`^Bearer\s+(.+)$`)
		match := re.FindStringSubmatch(token)
		if len(match) < 2 {
			err := gin_.ApiError{
				Code:    http.StatusUnauthorized,
				Message: "No bearer token found",
			}
			gin_.AbortWithStatusJSON(c, err)
			return
		}
		authtoken := match[1]
		user, err := auth.GetUserFromToken(authtoken)
		if err != nil {
			gin_.AbortWithStatusJSON(c, err)
			return
		}

		if checkAdmin && !bool(user.IsAdmin) {
			err := gin_.ApiError{
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
