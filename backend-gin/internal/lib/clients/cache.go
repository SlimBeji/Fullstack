package clients

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisClientConfig struct {
	URL        string
	Expiration int // duration in seconds
}

type RedisClient struct {
	config RedisClientConfig
	client *redis.Client
}

func (r *RedisClient) getDuration() time.Duration {
	return time.Duration(r.config.Expiration) * time.Second
}

func (r *RedisClient) Get(ctx context.Context, key string) (string, error) {
	val, err := r.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return "", nil
	}
	return val, err
}

func (r *RedisClient) GetStruct(ctx context.Context, key string, data any) error {
	val, err := r.client.Get(ctx, key).Result()
	if err != nil {
		// Not found -> redis.Nil or a redis error
		return err
	}

	err = json.Unmarshal([]byte(val), data)
	if err == nil {
		return nil
	}

	log.Printf("Failed to unmarshal Redis key %s: %v. Deleting corrupt data.", key, err)
	_ = r.Delete(ctx, key)
	return err
}

func (r *RedisClient) Set(ctx context.Context, key string, val any) error {
	data, err := json.Marshal(val)
	if err != nil {
		return fmt.Errorf("could not store value in redis: %w", err)
	}
	return r.client.Set(ctx, key, data, r.getDuration()).Err()
}

func (r *RedisClient) Delete(ctx context.Context, key string) error {
	return r.client.Del(ctx, key).Err()
}

func (r *RedisClient) FlushAll(ctx context.Context) error {
	return r.client.FlushAll(ctx).Err()
}

func (r *RedisClient) Close() error {
	return r.client.Close()
}

func NewRedisClient(config RedisClientConfig) *RedisClient {
	// Creating client
	opt, err := redis.ParseURL(config.URL)
	if err != nil {
		panic(fmt.Sprintf("Invalid Redis URL: %v", err))
	}
	client := redis.NewClient(opt)

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := client.Ping(ctx).Err(); err != nil {
		panic("failed to connect to Redis")
	}

	// Returning struct ref
	return &RedisClient{
		config: config,
		client: client,
	}
}
