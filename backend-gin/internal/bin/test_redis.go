package bin

import (
	"backend/internal/services/instances"
	"backend/internal/services/setup"
	"context"
	"fmt"
)

func TestRedis() {
	// setup
	setup := setup.New()
	defer setup.CloseSerivces()

	ctx := context.Background()
	redis := instances.GetRedisClient()
	defer redis.Close()
	redis.Set(ctx, "secret_number", 158)
	result, _ := redis.Get(ctx, "secret_number")
	fmt.Println(result)
	redis.Delete(ctx, "secret_number")
	result, _ = redis.Get(ctx, "secret_number")
	fmt.Println(result)
}
