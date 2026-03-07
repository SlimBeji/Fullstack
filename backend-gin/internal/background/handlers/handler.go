package handlers

import (
	"backend/internal/background/bgconfig"
	"backend/internal/config"
	"backend/internal/lib/clients"
	"sync"
)

var TasksRegistery = clients.TasksRegistryType{
	string(bgconfig.TaskNewsletter):     HandleSendingNewsletter,
	string(bgconfig.TaskPlaceEmbedding): HandlePlaceEmbedding,
}

var (
	once    sync.Once
	handler *clients.TaskHandler
)

func GetHandler() *clients.TaskHandler {
	once.Do(func() {
		handlerConfig := clients.TaskHandlerConfig{
			Url:       config.Env.GetRedisURL(),
			Registry:  TasksRegistery,
			AllQueues: bgconfig.AllQueues,
		}
		handler = clients.NewHandler(handlerConfig)
		handler.Start()
	})
	return handler
}
