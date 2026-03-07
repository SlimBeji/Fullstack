package bin

import (
	"backend/internal/models/examples"
	"backend/internal/services/instances"
)

func DumpDb() {
	pgCLient := instances.GetPgClient()
	defer pgCLient.Close()
	redisClient := instances.GetRedisClient()
	defer redisClient.Close()
	examples.DumpDb(true)
}
