package publishers

import (
	"backend/internal/config"
	"backend/internal/lib/clients"
	"sync"
)

var (
	once      sync.Once
	publisher *clients.TaskPublisher
)

func GetPublisher() *clients.TaskPublisher {
	once.Do(func() { publisher = clients.NewPublisher(config.Env.RedisURL) })
	return publisher
}
