package routes

import (
	"backend/internal/api/middlewares"
	"backend/internal/lib/gin_"
	"backend/internal/models/cruds"
	"backend/internal/models/schemas"
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
	searchQuery, _ := gin_.GetSearchQuery(c)
	cu := cruds.GetCRUDSUser()
	data, err := cu.Paginate(searchQuery, &cruds.UserOptions{Process: true})
	if err != nil {
		gin_.AbortWithStatusJSON(c, err)
		return
	}
	c.JSON(http.StatusOK, data)
}

// @Summary      Search and Retrieve users
// @Tags         User
// @Accept       application/json
// @Produce      json
// @Security     OAuth2Password[admin]
// @Param        params body schemas.UserFilters true "POST parameters"
// @Success      200  {object}  schemas.UsersPaginated
// @Router       /api/users/search [post]
func searchUsers(c *gin.Context) {
	searchQuery, _ := gin_.GetSearchQuery(c)
	cu := cruds.GetCRUDSUser()
	data, err := cu.Paginate(searchQuery, &cruds.UserOptions{Process: true})
	if err != nil {
		gin_.AbortWithStatusJSON(c, err)
		return
	}
	c.JSON(http.StatusOK, data)
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
	currentUser := c.MustGet("currentUser").(schemas.UserRead)
	body, _ := gin_.GetBody[schemas.UserPost](c)

	cu := cruds.GetCRUDSUser()
	newUser, err := cu.UserPost(currentUser, body, &cruds.UserOptions{Process: true})
	if err != nil {
		gin_.AbortWithStatusJSON(c, err)
		return
	}
	c.JSON(http.StatusOK, newUser)
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
	userId, err := gin_.ExtractId(c, "userId")
	if err != nil {
		gin_.AbortWithStatusJSON(c, err)
		return
	}

	cu := cruds.GetCRUDSUser()
	user, err := cu.Get(userId, &cruds.UserOptions{Process: true})
	if err != nil {
		gin_.AbortWithStatusJSON(c, err)
		return
	}
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
	currentUser := c.MustGet("currentUser").(schemas.UserRead)
	body, _ := gin_.GetBody[schemas.UserPut](c)

	userId, err := gin_.ExtractId(c, "userId")
	if err != nil {
		gin_.AbortWithStatusJSON(c, err)
		return
	}

	cu := cruds.GetCRUDSUser()
	user, err := cu.UserPut(currentUser, userId, body, &cruds.UserOptions{Process: true})
	if err != nil {
		gin_.AbortWithStatusJSON(c, err)
		return
	}
	c.JSON(http.StatusOK, user)
}

type UserDeleteResponse struct {
	Message string `json:"message" example:"Deleted user 507f1f77bcf86cd799439011"`
}

// @Summary      Delete user by id
// @Tags         User
// @Accept       application/json
// @Produce      json
// @Security     OAuth2Password[admin]
// @Param        userId path string true "User ID"
// @Success      200  {object}  UserDeleteResponse
// @Router       /api/users/{userId} [delete]
func deleteUser(c *gin.Context) {
	currentUser := c.MustGet("currentUser").(schemas.UserRead)

	userId, err := gin_.ExtractId(c, "userId")
	if err != nil {
		gin_.AbortWithStatusJSON(c, err)
		return
	}

	cu := cruds.GetCRUDSUser()
	err = cu.UserDelete(currentUser, userId)
	if err != nil {
		gin_.AbortWithStatusJSON(c, err)
		return
	}

	message := fmt.Sprintf("Deleted user %d", userId)
	c.JSON(http.StatusOK, gin.H{"message": message})
}

func RegisterUsers(r *gin.Engine) {
	router := r.Group(("/api/users"))
	router.GET(
		"/",
		middlewares.Authenticated,
		gin_.QueryFilters[schemas.UserSearch],
		getUsers,
	)
	router.POST(
		"/search",
		middlewares.Authenticated,
		gin_.BodyFilters[schemas.UserSearch],
		searchUsers,
	)
	router.POST(
		"",
		middlewares.Admin,
		gin_.BodyValidator[schemas.UserPost],
		createUser,
	)
	router.GET(
		"/:userId",
		middlewares.Authenticated,
		gin_.QueryValidator[schemas.UserGet],
		getUser,
	)
	router.PUT(
		"/:userId",
		middlewares.Authenticated,
		gin_.BodyValidator[schemas.UserPut],
		updateUser,
	)
	router.DELETE("/:userId", middlewares.Admin, deleteUser)
}
