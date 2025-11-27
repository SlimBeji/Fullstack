package setup

import (
	"backend/internal/lib/clients"
	"backend/internal/models/examples"
	"backend/internal/types_"
	"context"
	"fmt"
)

type AppSetup struct {
	Mongo   *clients.MongoClient
	Redis   *clients.RedisClient
	Storage *clients.CloudStorage
}

func (a *AppSetup) CloseSerives() {
	a.Mongo.Close()
	a.Redis.Close()
	a.Storage.Close()
}

func (a *AppSetup) IndexCollections(mapping types_.IndexMapping) {
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
		Mongo:   clients.GetMongo(),
		Redis:   clients.GetRedisClient(),
		Storage: clients.GetStorage(),
	}
}

func SeedTestData() {
	examples.DumpDb()
	examples.SeedDb()
}
