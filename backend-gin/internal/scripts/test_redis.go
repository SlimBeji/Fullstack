package scripts

import (
	"backend/internal/lib/clients"
	"backend/internal/lib/setup"
	"fmt"
)

func TestRedis() {
	// setup
	setup := setup.New()
	defer setup.CloseSerives()

	redis := clients.GetRedisClient()
	defer redis.Close()
	redis.Set("secret_number", 158)
	result, _ := redis.Get("secret_number")
	fmt.Println(result)
	redis.Delete("secret_number")
	result, _ = redis.Get("secret_number")
	fmt.Println(result)
}
