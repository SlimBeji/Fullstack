package handlers

import (
	"backend/internal/background/tasks/taskspec"
	"context"

	"github.com/hibiken/asynq"
)

type HandlerFunc = func(ctx context.Context, t *asynq.Task) error
type TasksRegisteryType = map[taskspec.TaskType]HandlerFunc

var TASKS_REGISTERY = TasksRegisteryType{
	taskspec.TaskNewsletter:     HandleSendingNewsletter,
	taskspec.TaskPlaceEmbedding: HandlePlaceEmbedding,
}
