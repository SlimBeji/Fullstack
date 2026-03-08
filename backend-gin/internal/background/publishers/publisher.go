package publishers

import (
	"backend/internal/config"
	"backend/internal/lib/clients"
	"sync"
)

var GetPublisher = sync.OnceValue(func() *clients.TaskPublisher {
	return clients.NewPublisher(config.Env.GetRedisURL())
})
