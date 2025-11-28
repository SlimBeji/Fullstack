package tasks

import (
	"backend/internal/config"
	"backend/internal/types_"
	"fmt"
	"strings"
	"sync"

	"github.com/hibiken/asynq"
)

type TasksManager struct {
	client *asynq.Client
	mux    *asynq.ServeMux
	server *asynq.Server
}

func (tm *TasksManager) Start() {
	if err := tm.server.Start(tm.mux); err != nil {
		newErr := fmt.Errorf("could not start the task manager: %w", err)
		panic(newErr)
	}
}

func (tm *TasksManager) Close() {
	tm.server.Shutdown()
	tm.client.Close()
}

func (tm *TasksManager) NewTask(
	name types_.Tasks, payload []byte, opts ...asynq.Option,
) (*asynq.TaskInfo, error) {
	task := asynq.NewTask(string(name), payload)
	return tm.client.Enqueue(task, opts...)
}

func newTaskManager() *TasksManager {
	// redis config
	url := strings.TrimPrefix(config.Env.RedisURL, "redis://")
	url = strings.SplitN(url, "/", 2)[0]
	redisConfig := asynq.RedisClientOpt{Addr: url}

	// client
	client := asynq.NewClient(redisConfig)

	// mux server
	mux := asynq.NewServeMux()
	for name, handler := range tasksRegistery {
		mux.HandleFunc(string(name), handler)
	}

	// server
	queues := make(map[string]int)
	for _, name := range types_.AllQueues {
		queues[string(name)] = 1
	}
	config := asynq.Config{Queues: queues, Concurrency: 10}
	server := asynq.NewServer(redisConfig, config)

	tm := TasksManager{client: client, mux: mux, server: server}
	go tm.Start()
	return &tm
}

// Singleteon pattern

var (
	once        sync.Once
	taskManager *TasksManager
)

func GetTaskManager() *TasksManager {
	once.Do(func() {
		taskManager = newTaskManager()
	})
	return taskManager
}
