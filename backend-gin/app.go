package main

import (
	"backend/internal/api/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	routes.RegisterRoutes(r)
	r.Run(":5002")
}
