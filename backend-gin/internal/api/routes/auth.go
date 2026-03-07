package routes

import (
	"backend/internal/lib/gin_"
	"backend/internal/models/cruds"
	"backend/internal/models/schemas"
	"net/http"

	"github.com/gin-gonic/gin"
)

// @Summary      User registration
// @Tags         Auth
// @Accept       mpfd
// @Produce      json
// @Param        params formData schemas.SignupForm true "Signup parameters"
// @Param        image  formData file   true "User's profile image (JPEG)"
// @Success      200  {object}  schemas.EncodedToken
// @Router       /api/auth/signup [post]
func signup(c *gin.Context) {
	body, _ := gin_.GetBody[schemas.SignupForm](c)
	cu := cruds.GetCRUDSUser()
	resp, err := cu.Signup(c, body)
	if err != nil {
		gin_.AbortWithStatusJSON(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

// @Summary      User authentication
// @Tags         Auth
// @Accept       x-www-form-urlencoded
// @Produce      json
// @Param        params formData schemas.SigninForm true "Signin parameters"
// @Success      200  {object}  schemas.EncodedToken
// @Router       /api/auth/signin [post]
func signin(c *gin.Context) {
	body, _ := gin_.GetBody[schemas.SigninForm](c)
	cu := cruds.GetCRUDSUser()
	resp, err := cu.Signin(c, body)
	if err != nil {
		gin_.AbortWithStatusJSON(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func RegisterAuth(r *gin.Engine) {
	router := r.Group("/api/auth")
	router.POST(
		"/signup", gin_.BodyValidator[schemas.SignupForm], signup,
	)
	router.POST(
		"/signin", gin_.BodyValidator[schemas.SigninForm], signin,
	)
}
