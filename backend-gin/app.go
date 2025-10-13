package main

import (
	"backend/internal/api/middlewares"
	"backend/internal/api/routes"
	"backend/internal/config"
	"fmt"

	_ "backend/internal/api/docs"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @tag.name Auth
// @tag.description Registration and Authentication endpoints
// @tag.name Hello World
// @tag.description Hello World endpoints
// @tag.name User
// @tag.description User crud endpoints
// @tag.name Place
// @tag.description Place crud endpoints
// @securityDefinitions.oauth2.password OAuth2Password
// @tokenUrl /api/auth/signin
func main() {
	r := gin.Default()
	r.Use(middlewares.CORS())
	routes.RegisterRoutes(r)
	r.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	r.Run(fmt.Sprintf(":%d", config.Env.Port))
}
