package main

import (
	"backend/internal/api/routes"
	"backend/internal/config"
	"backend/internal/lib/clients"
	"fmt"

	_ "backend/internal/api/docs"
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
	// Initialize DBS connection
	dbs := clients.GetDbs()
	defer dbs.Close()
	r := routes.SetupRouter()
	r.Run(fmt.Sprintf(":%d", config.Env.Port))
}
