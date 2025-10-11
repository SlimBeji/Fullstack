package routes

import (
	"backend/internal/api/middlewares"
	"backend/internal/models/schemas"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func createUser(c *gin.Context) {
	user := c.MustGet("currentUser").(schemas.UserRead)
	c.JSON(http.StatusOK, user)
}

func getUser(c *gin.Context) {
	fmt.Println(c.Param("userId"))
	user := c.MustGet("currentUser").(schemas.UserRead)
	c.JSON(http.StatusOK, user)
}

func updateUser(c *gin.Context) {
	fmt.Println(c.Param("userId"))
	user := c.MustGet("currentUser").(schemas.UserRead)
	c.JSON(http.StatusOK, user)
}

func deleteUser(c *gin.Context) {
	userId := c.Param("userId")
	message := fmt.Sprintf("Deleted user %s", userId)
	c.JSON(http.StatusOK, gin.H{"message": message})
}

func RegisterUsers(r *gin.Engine) {
	router := r.Group(("/api/users"))
	router.POST("", middlewares.Admin, createUser)
	router.GET("/:userId", middlewares.Authenticated, getUser)
	router.PUT("/:userId", middlewares.Authenticated, updateUser)
	router.DELETE("/:userId", middlewares.Admin, deleteUser)
}
