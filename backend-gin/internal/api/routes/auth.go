package routes

import (
	"backend/internal/api/middlewares"
	"backend/internal/models/schemas"
	"net/http"

	"github.com/gin-gonic/gin"
)

func dummyToken() schemas.EncodedToken {
	return schemas.EncodedToken{
		AccessToken: "some_access_token",
		TokenType:   "bearer",
		UserId:      "683b21134e2e5d46978daf1f",
		Email:       "mslimbeji@gmail.com",
		ExpiresIn:   3600,
	}
}

func signup(c *gin.Context) {
	c.JSON(http.StatusOK, dummyToken())
}

func signin(c *gin.Context) {
	c.JSON(http.StatusOK, dummyToken())
}

func RegisterAuth(r *gin.Engine) {
	router := r.Group("/api/auth")
	router.POST("/signup", middlewares.BodyExtractor, signup)
	router.POST("/signin", middlewares.BodyExtractor, signin)
}
