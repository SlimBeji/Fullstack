package routes

import (
	"backend/internal/api/middlewares"
	"backend/internal/background/publishers"
	"backend/internal/lib/gin_"
	"backend/internal/models/schemas"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type HelloResponse struct {
	Message string `json:"message" example:"Hello World!"`
}

// @Summary      Hello World Endpoint
// @Tags         Hello World
// @Produce      json
// @Success      200  {object}  HelloResponse
// @Router       /api/hello-world/ [get]
func hello(c *gin.Context) {
	_, err := publishers.SendNewsletter("Slim", "mslimbeji@gmail.com")
	if err != nil {
		gin_.AbortWithStatusJSON(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Hello World!",
	})
}

type HelloUserResponse struct {
	Message string `json:"message" example:"Hello Slim"`
}

// @Summary      Hello World Endpoint for authenticated users
// @Tags         Hello World
// @Produce      json
// @Security     OAuth2Password[admin]
// @Success      200  {object}  HelloUserResponse
// @Router       /api/hello-world/user [get]
func helloUser(c *gin.Context) {
	user := c.MustGet("currentUser").(schemas.UserRead)
	message := fmt.Sprintf("Hello %s!", user.Name)
	c.JSON(http.StatusOK, gin.H{
		"message": message,
	})
}

type HelloAdminResponse struct {
	Message string `json:"message" example:"Hello Admin Slim"`
}

// @Summary      Hello World Endpoint for admins only
// @Tags         Hello World
// @Produce      json
// @Security     OAuth2Password[admin]
// @Success      200  {object}  HelloAdminResponse
// @Router       /api/hello-world/admin [get]
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
