package main

import (
	"backend/internal/api/routes"
	"backend/internal/config"
	"fmt"

	_ "backend/internal/api/docs"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	r := gin.Default()
	routes.RegisterRoutes(r)
	r.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	r.Run(fmt.Sprintf(":%d", config.Env.Port))
}
