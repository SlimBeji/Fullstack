package handlers

import (
	"backend/internal/background"
	"backend/internal/lib/clients"
	"sync"
)

var TASKS_REGISTERY = clients.TasksRegisteryType{
	background.TaskNewsletter:     HandleSendingNewsletter,
	background.TaskPlaceEmbedding: HandlePlaceEmbedding,
}

var (
	once    sync.Once
	handler *clients.TaskHandler
)

func GetHandler() *clients.TaskHandler {
	once.Do(func() { handler = clients.NewHandler(TASKS_REGISTERY) })
	return handler
}
