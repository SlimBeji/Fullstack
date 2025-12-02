package setup

import (
	"backend/internal/lib/clients"
	"backend/internal/models/collections"
	"backend/internal/models/examples"
	"backend/internal/worker/crons"
	"backend/internal/worker/tasks/handler"
	"backend/internal/worker/tasks/publisher"
	"context"
	"fmt"
)

type AppSetup struct {
	Mongo         *clients.MongoClient
	Redis         *clients.RedisClient
	Storage       *clients.CloudStorage
	TaskPublisher *publisher.TaskPublisher
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
		Mongo:         clients.GetMongo(),
		Redis:         clients.GetRedisClient(),
		Storage:       clients.GetStorage(),
		TaskPublisher: publisher.GetPublisher(),
		TaskHandler:   handler.GetHandler(),
		TaskScheduler: crons.GetScheduler(),
	}
}

func SeedTestData() {
	examples.DumpDb()
	examples.SeedDb()
}
