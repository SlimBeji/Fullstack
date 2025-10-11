package routes

import (
	"backend/internal/api/middlewares"
	"backend/internal/models/schemas"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func hello(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Hello World!",
	})
}

func helloUser(c *gin.Context) {
	user := c.MustGet("currentUser").(schemas.UserRead)
	message := fmt.Sprintf("Hello %s!", user.Name)
	c.JSON(http.StatusOK, gin.H{
		"message": message,
	})
}

func helloAdmin(c *gin.Context) {
	user := c.MustGet("currentUser").(schemas.UserRead)
	message := fmt.Sprintf("Hello Admin %s!", user.Name)
	c.JSON(http.StatusOK, gin.H{
		"message": message,
	})
}

func RegisterHelloWorld(r *gin.Engine) {
	router := r.Group("/api/hello-world")
	router.GET("", hello)
	router.GET("/user", middlewares.Authenticated, helloUser)
	router.GET("/admin", middlewares.Admin, helloAdmin)
}
