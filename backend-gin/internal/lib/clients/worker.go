package clients

import (
	"backend/internal/background"
	"backend/internal/config"
	"context"
	"fmt"
	"strings"

	"github.com/hibiken/asynq"
)

// Publisher

type TaskPublisher struct {
	client *asynq.Client
}

func NewPublisher(brokerUrl string) *TaskPublisher {
	url := strings.TrimPrefix(brokerUrl, "redis://")
	url = strings.SplitN(url, "/", 2)[0]
	redisConfig := asynq.RedisClientOpt{Addr: url}
	client := asynq.NewClient(redisConfig)
	return &TaskPublisher{client: client}
}

func (tp *TaskPublisher) Close() {
	tp.client.Close()
}

func (tm *TaskPublisher) NewTask(
	name background.TaskType, payload []byte, opts ...asynq.Option,
) (*asynq.TaskInfo, error) {
	task := asynq.NewTask(string(name), payload)
	opts = append(opts, asynq.Retention(background.MAX_AGE))
	return tm.client.Enqueue(task, opts...)
}

// Handler

type HandlerFunc = func(ctx context.Context, t *asynq.Task) error
type TasksRegisteryType = map[background.TaskType]HandlerFunc

type TaskHandler struct {
	mux    *asynq.ServeMux
	server *asynq.Server
}

func NewHandler(registery TasksRegisteryType) *TaskHandler {
	// redis config
	url := strings.TrimPrefix(config.Env.RedisURL, "redis://")
	url = strings.SplitN(url, "/", 2)[0]
	redisConfig := asynq.RedisClientOpt{Addr: url}

	// mux server
	mux := asynq.NewServeMux()
	for name, handler := range registery {
		mux.HandleFunc(string(name), handler)
	}

	// server
	queues := make(map[string]int)
	for _, name := range background.AllQueues {
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
