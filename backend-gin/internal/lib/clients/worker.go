package clients

import (
	"backend/internal/background"
	"context"
	"fmt"
	"strings"

	"github.com/hibiken/asynq"
)

func extractRedisAddress(url string) string {
	addr := strings.TrimPrefix(url, "redis://")
	return strings.SplitN(addr, "/", 2)[0]
}

// Publisher

type TaskPublisher struct {
	client *asynq.Client
}

func NewPublisher(brokerUrl string) *TaskPublisher {
	url := extractRedisAddress(brokerUrl)
	redisConfig := asynq.RedisClientOpt{Addr: url}
	client := asynq.NewClient(redisConfig)
	return &TaskPublisher{client: client}
}

func (tp *TaskPublisher) Close() error {
	return tp.client.Close()
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
type TasksRegistryType = map[background.TaskType]HandlerFunc

type TaskHandlerConfig struct {
	Url      string
	Registry TasksRegistryType
}

type TaskHandler struct {
	mux    *asynq.ServeMux
	server *asynq.Server
}

func NewHandler(config TaskHandlerConfig) *TaskHandler {
	// redis config
	addr := extractRedisAddress(config.Url)
	redisConfig := asynq.RedisClientOpt{Addr: addr}

	// mux server
	mux := asynq.NewServeMux()
	for name, handler := range config.Registry {
		mux.HandleFunc(string(name), handler)
	}

	// server
	queues := make(map[string]int)
	for _, name := range background.AllQueues {
		queues[string(name)] = 1
	}
	asynqConfig := asynq.Config{Queues: queues, Concurrency: 10}
	server := asynq.NewServer(redisConfig, asynqConfig)
	tm := TaskHandler{mux: mux, server: server}
	return &tm
}

func (th *TaskHandler) Start() {
	if err := th.server.Start(th.mux); err != nil {
		newErr := fmt.Errorf("could not start the task manager: %w", err)
		panic(newErr)
	}
}

func (th *TaskHandler) Close() error {
	// Shutdown() method does not return an err
	// Returning nil to keep the pattern
	th.server.Shutdown()
	return nil
}
