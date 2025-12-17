package setup

import (
	"backend/internal/background/crons"
	"backend/internal/background/publishers"
	"backend/internal/background/tasks/handler"
	"backend/internal/lib/clients"
	"backend/internal/models/collections"
	"backend/internal/models/examples"
	"backend/internal/services/instances"
	"context"
	"fmt"
)

type AppSetup struct {
	Mongo         *clients.MongoClient
	Redis         *clients.RedisClient
	Storage       *clients.CloudStorage
	TaskPublisher *publishers.TaskPublisher
	TaskHandler   *handler.TaskHandler
	TaskScheduler *crons.TaskScheduler
}

func (a *AppSetup) CloseSerives() {
	a.Mongo.Close()
	a.Redis.Close()
	a.Storage.Close()
	a.TaskPublisher.Close()
	a.TaskHandler.Close()
	a.TaskScheduler.Close()
}

func (a *AppSetup) IndexCollections(mapping collections.IndexMapping) {
	for name, indexes := range mapping {
		collection := a.Mongo.DB.Collection(string(name))
		_, err := collection.Indexes().CreateMany(
			context.Background(), indexes,
		)
		if err != nil {
			panic(fmt.Sprintf("could not index collection %s", name))
		}
	}
}

func New() *AppSetup {
	return &AppSetup{
		Mongo:         instances.GetMongo(),
		Redis:         instances.GetRedisClient(),
		Storage:       instances.GetStorage(),
		TaskPublisher: publishers.GetPublisher(),
		TaskHandler:   handler.GetHandler(),
		TaskScheduler: crons.GetScheduler(),
	}
}

func SeedTestData() {
	examples.DumpDb()
	examples.SeedDb()
}
