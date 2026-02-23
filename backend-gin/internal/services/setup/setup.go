package setup

import (
	"backend/internal/background/crons"
	"backend/internal/background/handlers"
	"backend/internal/background/publishers"
	"backend/internal/lib/clients"
	"backend/internal/models/examples"
	"backend/internal/services/instances"
)

type AppSetup struct {
	Mongo         *clients.MongoClient
	Redis         *clients.RedisClient
	Storage       *clients.CloudStorage
	TaskPublisher *clients.TaskPublisher
	TaskHandler   *clients.TaskHandler
	TaskScheduler *clients.TaskScheduler
}

func (a *AppSetup) CloseSerives() {
	a.Mongo.Close()
	a.Redis.Close()
	a.Storage.Close()
	a.TaskPublisher.Close()
	a.TaskHandler.Close()
	a.TaskScheduler.Close()
}

func New() *AppSetup {
	return &AppSetup{
		Mongo:         instances.GetMongo(),
		Redis:         instances.GetRedisClient(),
		Storage:       instances.GetStorage(),
		TaskPublisher: publishers.GetPublisher(),
		TaskHandler:   handlers.GetHandler(),
		TaskScheduler: crons.GetScheduler(),
	}
}

func SeedTestData() {
	examples.DumpDb()
	examples.SeedDb()
}
