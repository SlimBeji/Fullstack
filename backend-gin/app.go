package main

import (
	"backend/internal/api/routes"
	"backend/internal/config"
	"backend/internal/lib/setup"
	"backend/internal/models/collections"
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
	setup := setup.New()
	setup.IndexCollections(collections.IndexStore)
	defer setup.CloseSerives()
	r := routes.SetupRouter()
	r.Run(fmt.Sprintf(":%d", config.Env.Port))
}
