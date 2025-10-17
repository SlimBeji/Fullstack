package clients

type AppDB struct {
	Redis   *RedisClient
	Storage *CloudStorage
}

func GetDbs() *AppDB {
	return &AppDB{
		Redis:   GetRedisClient(),
		Storage: GetStorage(),
	}
}
