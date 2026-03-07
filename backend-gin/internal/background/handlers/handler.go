package handlers

import (
	"backend/internal/background/bgconfig"
	"backend/internal/config"
	"backend/internal/lib/clients"
	"sync"
)

var TASKS_REGISTERY = clients.TasksRegistryType{
	bgconfig.TaskNewsletter:     HandleSendingNewsletter,
	bgconfig.TaskPlaceEmbedding: HandlePlaceEmbedding,
}

var (
	once    sync.Once
	handler *clients.TaskHandler
)

func GetHandler() *clients.TaskHandler {
	once.Do(func() {
		handlerConfig := clients.TaskHandlerConfig{
			Url:      config.Env.GetRedisURL(),
			Registry: TASKS_REGISTERY,
		}
		handler = clients.NewHandler(handlerConfig)
		handler.Start()
	})
	return handler
}
