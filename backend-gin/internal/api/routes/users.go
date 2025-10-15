package routes

import (
	"backend/internal/api/middlewares"
	"backend/internal/lib/utils"
	"backend/internal/models/schemas"
	"backend/internal/types_"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// @Summary      Search and Filter users
// @Tags         User
// @Accept       application/json
// @Produce      json
// @Security     OAuth2Password[admin]
// @Param        params query schemas.UserFilters true "GET parameters"
// @Success      200  {object}  schemas.UsersPaginated
// @Router       /api/users/ [get]
func getUsers(c *gin.Context) {
	findQuery, _ := utils.GetBody[types_.FindQuery](c)
	fmt.Println(findQuery)
	user := c.MustGet("currentUser").(schemas.UserRead)
	c.JSON(http.StatusOK, user)
}

// @Summary      Search and Retrieve users
// @Tags         User
// @Accept       application/json
// @Produce      json
// @Security     OAuth2Password[admin]
// @Param        params body schemas.UserFilters true "POST parameters"
// @Success      200  {object}  schemas.UsersPaginated
// @Router       /api/users/query [post]
func queryUsers(c *gin.Context) {
	findQuery, _ := utils.GetBody[types_.FindQuery](c)
	fmt.Println(findQuery)
	user := c.MustGet("currentUser").(schemas.UserRead)
	c.JSON(http.StatusOK, user)
}

// @Summary      User creation
// @Tags         User
// @Accept       mpfd
// @Produce      json
// @Security     OAuth2Password[admin]
// @Param        params formData schemas.UserPost true "POST parameters"
// @Param        image  formData file   true "the user profile image"
// @Success      200  {object}  schemas.UserRead
// @Router       /api/users [post]
func createUser(c *gin.Context) {
	body, _ := utils.GetBody[schemas.UserPost](c)
	fmt.Println(body)
	user := c.MustGet("currentUser").(schemas.UserRead)
	c.JSON(http.StatusOK, user)
}

// @Summary      Search and Retrieve user by id
// @Tags         User
// @Accept       application/json
// @Produce      json
// @Security     OAuth2Password[admin]
// @Param        userId path string true "User ID"
// @Success      200  {object}  schemas.UserRead
// @Router       /api/users/{userId} [get]
func getUser(c *gin.Context) {
	fmt.Println(c.Param("userId"))
	user := c.MustGet("currentUser").(schemas.UserRead)
	c.JSON(http.StatusOK, user)
}

// @Summary      Update users
// @Tags         User
// @Accept       application/json
// @Produce      json
// @Security     OAuth2Password[admin]
// @Param        userId path string true "User ID"
// @Param        params body schemas.UserPut true "PUT parameters"
// @Success      200  {object}  schemas.UserRead
// @Router       /api/users/{userId} [put]
func updateUser(c *gin.Context) {
	body, _ := utils.GetBody[schemas.UserPut](c)
	fmt.Println(body)
	fmt.Println(c.Param("userId"))
	user := c.MustGet("currentUser").(schemas.UserRead)
	c.JSON(http.StatusOK, user)
}

type DeleteResponseExample struct {
	Message string `json:"message" example:"Deleted user 507f1f77bcf86cd799439011"`
}

// @Summary      Delete user by id
// @Tags         User
// @Accept       application/json
// @Produce      json
// @Security     OAuth2Password[admin]
// @Param        userId path string true "User ID"
// @Success      200  {object}  DeleteResponseExample
// @Router       /api/users/{userId} [delete]
func deleteUser(c *gin.Context) {
	userId := c.Param("userId")
	message := fmt.Sprintf("Deleted user %s", userId)
	c.JSON(http.StatusOK, gin.H{"message": message})
}

func RegisterUsers(r *gin.Engine) {
	router := r.Group(("/api/users"))
	router.GET(
		"",
		middlewares.Authenticated,
		middlewares.Filter[schemas.UserFilters],
		getUsers,
	)
	router.POST(
		"/query",
		middlewares.Authenticated,
		middlewares.Filter[schemas.UserFilters],
		queryUsers,
	)
	router.POST(
		"",
		middlewares.Admin,
		middlewares.BodyValidator[schemas.UserPost],
		createUser,
	)
	router.GET("/:userId", middlewares.Authenticated, getUser)
	router.PUT(
		"/:userId",
		middlewares.Authenticated,
		middlewares.BodyValidator[schemas.UserPut],
		updateUser,
	)
	router.DELETE("/:userId", middlewares.Admin, deleteUser)
}
