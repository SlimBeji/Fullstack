package handlers

import (
	"backend/internal/background"
	"context"

	"github.com/hibiken/asynq"
)

type HandlerFunc = func(ctx context.Context, t *asynq.Task) error
type TasksRegisteryType = map[background.TaskType]HandlerFunc

var TASKS_REGISTERY = TasksRegisteryType{
	background.TaskNewsletter:     HandleSendingNewsletter,
	background.TaskPlaceEmbedding: HandlePlaceEmbedding,
}
