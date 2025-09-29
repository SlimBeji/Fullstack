package routes

import (
	"backend/internal/api/middlewares"
	"net/http"

	"github.com/gin-gonic/gin"
)

var accessToken = struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	UserId      string `json:"userId"`
	Email       string `json:"email"`
	ExpiresIn   int16  `json:"expires_in"`
}{
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
