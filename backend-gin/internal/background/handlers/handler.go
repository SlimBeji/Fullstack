package handlers

import (
	"backend/internal/background/bgconfig"
	"backend/internal/config"
	"backend/internal/lib/clients"
	"sync"
)

var GetHandler = sync.OnceValue(func() *clients.TaskHandler {
	tasksRegistry := clients.TasksRegistryType{
		string(bgconfig.TaskNewsletter):     HandleSendingNewsletter,
		string(bgconfig.TaskPlaceEmbedding): HandlePlaceEmbedding,
	}

	handlerConfig := clients.TaskHandlerConfig{
		Url:       config.Env.GetRedisURL(),
		Registry:  tasksRegistry,
		AllQueues: bgconfig.AllQueues,
	}

	handler := clients.NewHandler(handlerConfig)
	handler.Start()
	return handler
})
