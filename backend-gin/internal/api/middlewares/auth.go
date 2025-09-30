package middlewares

import (
	"backend/internal/models/schemas"
	"net/http"

	"github.com/gin-gonic/gin"
)

func checkAuthToken(checkAdmin bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.Request.Header.Get("Authorization")
		if token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"detail": "Not authenticated"})
			return
		}

		user, _ := schemas.BuildStruct[schemas.User](map[string]any{
			"id":       "683b21134e2e5d46978daf1f",
			"name":     "Slimx",
			"email":    "mslimbeji@gmail.com",
			"isAdmin":  false,
			"imageUrl": "avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg",
			"places":   []string{"683b21134e2e5d46978daf1f"},
		})

		if checkAdmin && !user.IsAdmin.Value {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"detail": "Not an admin"})
			return
		}

		c.Set("currentUser", user)
		c.Next()
	}
}

var Authenticated = checkAuthToken(false)

var Admin = checkAuthToken(true)
