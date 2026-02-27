package bin

import (
	"backend/internal/services/instances"
	"context"
	"fmt"
)

func TestRedis() {
	// Get redis client
	ctx := context.Background()
	redis := instances.GetRedisClient()
	defer redis.Close()

	// Test setting and retrieving value
	redis.Set(ctx, "secret_number", 158)
	result, _ := redis.Get(ctx, "secret_number")
	fmt.Println(result)

	// Test setting and deleting value
	redis.Delete(ctx, "secret_number")
	result, _ = redis.Get(ctx, "secret_number")
	fmt.Println(result)
}
