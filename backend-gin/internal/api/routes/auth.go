package routes

import (
	"backend/internal/lib/gin_"
	"backend/internal/models/collections"
	"backend/internal/models/schemas"
	"context"
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
	uc := collections.GetUserCollection()
	ctx := context.Background()
	resp, err := uc.Signup(&body, ctx)
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
	uc := collections.GetUserCollection()
	ctx := context.Background()
	resp, err := uc.Signin(&body, ctx)
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
