package routes

import (
	"fmt"
	"io"
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
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	fmt.Println("Request body:", string(body))
	c.JSON(http.StatusOK, accessToken)
}

func signin(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	fmt.Println("Request body:", string(body))
	c.JSON(http.StatusOK, accessToken)
}

func RegisterAuth(r *gin.Engine) {
	router := r.Group("/api/auth")
	router.POST("/signup", signup)
	router.POST("/signin", signin)
}
