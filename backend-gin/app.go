package main

import (
	"backend/internal/api/routes"
	"backend/internal/config"
	"fmt"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	routes.RegisterRoutes(r)
	r.Run(fmt.Sprintf(":%d", config.Env.Port))
}
