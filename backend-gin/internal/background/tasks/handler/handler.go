package handler

import (
	"backend/internal/background/tasks/taskspec"
	"backend/internal/config"
	"context"
	"fmt"
	"strings"
	"sync"

	"github.com/hibiken/asynq"
)

type taskHandler = func(ctx context.Context, t *asynq.Task) error
type tasksRegisteryType = map[taskspec.TaskType]taskHandler

var TasksRegistery = tasksRegisteryType{
	taskspec.TaskNewsletter:     HandleSendingNewsletter,
	taskspec.TaskPlaceEmbedding: HandlePlaceEmbedding,
}

type TaskHandler struct {
	mux    *asynq.ServeMux
	server *asynq.Server
}

func new() *TaskHandler {
	// redis config
	url := strings.TrimPrefix(config.Env.RedisURL, "redis://")
	url = strings.SplitN(url, "/", 2)[0]
	redisConfig := asynq.RedisClientOpt{Addr: url}

	// mux server
	mux := asynq.NewServeMux()
	for name, handler := range TasksRegistery {
		mux.HandleFunc(string(name), handler)
	}

	// server
	queues := make(map[string]int)
	for _, name := range taskspec.AllQueues {
		queues[string(name)] = 1
	}
	config := asynq.Config{Queues: queues, Concurrency: 10}
	server := asynq.NewServer(redisConfig, config)

	tm := TaskHandler{mux: mux, server: server}
	go tm.Start()
	return &tm
}

func (th *TaskHandler) Start() {
	if err := th.server.Start(th.mux); err != nil {
		newErr := fmt.Errorf("could not start the task manager: %w", err)
		panic(newErr)
	}
}

func (th *TaskHandler) Close() {
	th.server.Shutdown()
}

// Singleteon pattern

var (
	once    sync.Once
	handler *TaskHandler
)

func GetHandler() *TaskHandler {
	once.Do(func() { handler = new() })
	return handler
}
