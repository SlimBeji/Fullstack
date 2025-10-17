package clients

type AppDB struct {
	Redis *RedisClient
}

func GetDbs() *AppDB {
	return &AppDB{
		Redis: GetRedisClient(),
	}
}
