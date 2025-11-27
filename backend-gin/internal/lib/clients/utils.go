package clients

import (
	"backend/internal/types_"
	"context"
	"fmt"
)

type AppDB struct {
	Mongo   *MongoClient
	Redis   *RedisClient
	Storage *CloudStorage
}

func (a *AppDB) Close() {
	a.Mongo.Close()
	a.Redis.Close()
	a.Storage.Close()
}

func (a *AppDB) IndexCollections(mapping types_.IndexMapping) {
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

func GetDbs() *AppDB {
	return &AppDB{
		Mongo:   GetMongo(),
		Redis:   GetRedisClient(),
		Storage: GetStorage(),
	}
}
