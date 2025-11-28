package tasks

import (
	"backend/internal/types_"
	"context"

	"github.com/hibiken/asynq"
)

type taskHandler = func(ctx context.Context, t *asynq.Task) error
type tasksRegisteryType = map[types_.Tasks]taskHandler

var tasksRegistery = tasksRegisteryType{
	types_.TasksNewsletter:     HandleSendingNewsletter,
	types_.TasksPlaceEmbedding: HandlePlaceEmbedding,
}
