package scripts

import (
	"backend/internal/lib/clients"
	"fmt"
)

func TestRedis() {
	redis := clients.GetRedisClient()
	defer redis.Close()
	redis.Set("secret_number", 158)
	result, _ := redis.Get("secret_number")
	fmt.Println(result)
	redis.Delete("secret_number")
	result, _ = redis.Get("secret_number")
	fmt.Println(result)
}
