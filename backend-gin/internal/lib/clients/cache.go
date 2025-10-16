package clients

import (
	"backend/internal/config"
	"context"
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisClient struct {
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

func (r *RedisClient) Set(key string, val any, expirationSeconds ...int) error {
	data, err := json.Marshal(val)
	if err != nil {
		return fmt.Errorf("could not store value in redis: %v", err)
	}
	exp := getDuration(expirationSeconds...)
	return r.client.Set(r.ctx, key, data, exp).Err()
}

func (r *RedisClient) Delete(key string) error {
	return r.client.Del(r.ctx, key).Err()
}

func getDuration(expirationSeconds ...int) time.Duration {
	duration := config.Env.RedisExpiration
	if len(expirationSeconds) > 0 {
		duration = expirationSeconds[0]
	}

	exp := time.Duration(duration) * time.Second
	return exp
}

func NewRedisClient() *RedisClient {
	url := config.Env.RedisURL
	if testing.Testing() {
		url = config.Env.RedisTestURL
	}
	opt, err := redis.ParseURL(url)
	if err != nil {
		panic(fmt.Sprintf("Invalid Redis URL: %v", err))
	}

	return &RedisClient{
		client: redis.NewClient(opt),
		ctx:    context.Background(),
	}
}

var Redis *RedisClient

func init() {
	Redis = NewRedisClient()
}
