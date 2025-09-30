package routes

import (
	"backend/internal/api/middlewares"
	"backend/internal/models/schemas"
	"net/http"

	"github.com/gin-gonic/gin"
)

var accessToken, _ = schemas.BuildStruct[schemas.AccessToken](map[string]any{
	"access_token": "some_access_token",
	"token_type":   "bearer",
	"userId":       "u1234",
	"email":        "mslimbeji@gmail.com",
	"expires_in":   3600,
})

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
