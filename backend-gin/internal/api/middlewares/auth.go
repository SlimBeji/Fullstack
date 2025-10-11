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

		var user schemas.UserRead
		user.Id = "683b21134e2e5d46978daf1f"
		user.Name = "Slimx"
		user.Email = "mslimbeji@gmail.com"
		user.IsAdmin = false
		user.ImageUrl = "avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg"
		user.Places = []string{"683b21134e2e5d46978daf1f"}

		if checkAdmin && !user.IsAdmin {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"detail": "Not an admin"})
			return
		}

		c.Set("currentUser", user)
		c.Next()
	}
}

var Authenticated = checkAuthToken(false)

var Admin = checkAuthToken(true)
