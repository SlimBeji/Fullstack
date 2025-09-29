package routes

import (
	"backend/internal/api/middlewares"
	"backend/internal/models/schemas"
	"net/http"

	"github.com/gin-gonic/gin"
)

var accessToken = schemas.AccessToken{
	AccessToken: "some_access_token",
	TokenType:   "bearer",
	UserId:      "u123",
	Email:       "mslimbeji@gmail.com",
	ExpiresIn:   3600,
}

func signup(c *gin.Context) {
	c.JSON(http.StatusOK, accessToken)
}

func signin(c *gin.Context) {
	c.JSON(http.StatusOK, accessToken)
}

func RegisterAuth(r *gin.Engine) {
	router := r.Group("/api/auth")
	router.POST("/signup", middlewares.BodyExtractor, signup)
	router.POST("/signin", middlewares.BodyExtractor, signin)
}
