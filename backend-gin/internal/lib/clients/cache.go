package clients

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisClientConfig struct {
	Url        string
	Expiration int
}

type RedisClient struct {
	config RedisClientConfig
	client *redis.Client
	ctx    context.Context
}

func (r *RedisClient) Close() error {
	return r.client.Close()
}

func (r *RedisClient) FlushAll() error {
	return r.client.FlushAll(r.ctx).Err()
}

func (r *RedisClient) Get(key string) (string, error) {
	val, err := r.client.Get(r.ctx, key).Result()
	if err == redis.Nil {
		return "", nil
	}
	return val, err
}

func (r *RedisClient) Set(key string, val any) error {
	data, err := json.Marshal(val)
	if err != nil {
		return fmt.Errorf("could not store value in redis: %v", err)
	}
	return r.client.Set(r.ctx, key, data, r.getDuration()).Err()
}

func (r *RedisClient) Delete(key string) error {
	return r.client.Del(r.ctx, key).Err()
}

func (r *RedisClient) getDuration() time.Duration {
	return time.Duration(r.config.Expiration) * time.Second
}

func NewRedisClient(config RedisClientConfig) *RedisClient {
	opt, err := redis.ParseURL(config.Url)
	if err != nil {
		panic(fmt.Sprintf("Invalid Redis URL: %v", err))
	}

	return &RedisClient{
		config: config,
		client: redis.NewClient(opt),
		ctx:    context.Background(),
	}
}
