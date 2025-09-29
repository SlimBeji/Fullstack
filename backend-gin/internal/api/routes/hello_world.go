package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func hello(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Hello World!",
	})
}

func helloUser(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Hello Slim!",
	})
}

func helloAdmin(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Hello Admin Slim!",
	})
}

func RegisterHelloWorld(r *gin.Engine) {
	router := r.Group("/api/hello-world")
	router.GET("", hello)
	router.GET("/user", helloUser)
	router.GET("/admin", helloAdmin)
}
