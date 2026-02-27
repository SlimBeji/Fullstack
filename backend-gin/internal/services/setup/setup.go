package setup

import (
	"backend/internal/background/crons"
	"backend/internal/background/handlers"
	"backend/internal/background/publishers"
	"backend/internal/lib/clients"
	"backend/internal/models/examples"
	"backend/internal/services/instances"
	"log"
)

type AppSetup struct {
	Mongo         *clients.MongoClient
	Pg            *clients.PgClient
	Redis         *clients.RedisClient
	Storage       *clients.CloudStorage
	TaskPublisher *clients.TaskPublisher
	TaskHandler   *clients.TaskHandler
	TaskScheduler *clients.TaskScheduler
}

func (a *AppSetup) CloseServices() {
	if err := a.Mongo.Close(); err != nil {
		log.Printf("failed to close Mongo: %v", err)
	}
	if err := a.Pg.Close(); err != nil {
		log.Printf("failed to close PostgreSQL: %v", err)
	}
	if err := a.Redis.Close(); err != nil {
		log.Printf("failed to close Redis: %v", err)
	}
	if err := a.Storage.Close(); err != nil {
		log.Printf("failed to close Storage: %v", err)
	}
	if err := a.TaskPublisher.Close(); err != nil {
		log.Printf("failed to close TaskPublisher: %v", err)
	}
	if err := a.TaskHandler.Close(); err != nil {
		log.Printf("failed to close TaskHandler: %v", err)
	}
	if err := a.TaskScheduler.Close(); err != nil {
		log.Printf("failed to close TaskScheduler: %v", err)
	}
}

func New() *AppSetup {
	return &AppSetup{
		Mongo:         instances.GetMongo(),
		Pg:            instances.GetPgClient(),
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
