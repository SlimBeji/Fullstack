package routes

import (
	"backend/internal/api/middlewares"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func RegisterRoutes(r *gin.Engine) {
	RegisterHelloWorld(r)
	RegisterAuth(r)
	RegisterUsers(r)
	RegisterPlaces(r)
}

func SetupRouter() *gin.Engine {
	r := gin.Default()
	r.Use(middlewares.CORS())
	RegisterRoutes(r)
	r.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	return r
}
