package routes

import (
	"backend/internal/api/middlewares"
	"backend/internal/lib/utils"
	"backend/internal/models/schemas"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func dummyToken() schemas.EncodedToken {
	return schemas.EncodedToken{
		AccessToken: "some_access_token",
		TokenType:   "bearer",
		UserId:      "683b21134e2e5d46978daf1f",
		Email:       "mslimbeji@gmail.com",
		ExpiresIn:   3600,
	}
}

// @Summary      User registration
// @Tags         Auth
// @Accept       mpfd
// @Produce      json
// @Param        params formData schemas.SignupForm true "Signup parameters"
// @Param        image  formData file   true "User's profile image (JPEG)"
// @Success      200  {object}  schemas.EncodedToken
// @Router       /api/auth/signup [post]
func signup(c *gin.Context) {
	body, _ := utils.GetBody[schemas.SignupForm](c)
	fmt.Println(body)
	c.JSON(http.StatusOK, dummyToken())
}

// @Summary      User authentication
// @Tags         Auth
// @Accept       x-www-form-urlencoded
// @Produce      json
// @Param        params formData schemas.SigninForm true "Signin parameters"
// @Success      200  {object}  schemas.EncodedToken
// @Router       /api/auth/signin [post]
func signin(c *gin.Context) {
	body, _ := utils.GetBody[schemas.SigninForm](c)
	fmt.Println(body)
	c.JSON(http.StatusOK, dummyToken())
}

func RegisterAuth(r *gin.Engine) {
	router := r.Group("/api/auth")
	router.POST("/signup", middlewares.BodyValidator[schemas.SignupForm], signup)
	router.POST("/signin", middlewares.BodyValidator[schemas.SigninForm], signin)
}
