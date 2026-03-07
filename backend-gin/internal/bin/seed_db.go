package bin

import (
	"backend/internal/models/examples"
	"backend/internal/services/instances"
)

func SeedDB() {
	pgCLient := instances.GetPgClient()
	defer pgCLient.Close()
	redisClient := instances.GetRedisClient()
	defer redisClient.Close()
	examples.SeedDb(true)
}
