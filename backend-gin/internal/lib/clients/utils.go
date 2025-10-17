package clients

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

func GetDbs() *AppDB {
	return &AppDB{
		Mongo:   GetMongo(),
		Redis:   GetRedisClient(),
		Storage: GetStorage(),
	}
}
