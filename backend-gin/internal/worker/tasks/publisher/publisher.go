package publisher

import (
	"backend/internal/config"
	"backend/internal/worker/tasks/taskspec"
	"strings"
	"sync"
	"time"

	"github.com/hibiken/asynq"
)

const MAX_AGE = 7 * 20 * time.Hour

type TaskPublisher struct {
	client *asynq.Client
}

func new() *TaskPublisher {
	url := strings.TrimPrefix(config.Env.RedisURL, "redis://")
	url = strings.SplitN(url, "/", 2)[0]
	redisConfig := asynq.RedisClientOpt{Addr: url}
	client := asynq.NewClient(redisConfig)
	return &TaskPublisher{client: client}
}

func (tp *TaskPublisher) Close() {
	tp.client.Close()
}

func (tm *TaskPublisher) NewTask(
	name taskspec.TaskType, payload []byte, opts ...asynq.Option,
) (*asynq.TaskInfo, error) {
	task := asynq.NewTask(string(name), payload)
	opts = append(opts, asynq.Retention(MAX_AGE))
	return tm.client.Enqueue(task, opts...)
}

// Singleteon pattern

var (
	once      sync.Once
	publisher *TaskPublisher
)

func GetPublisher() *TaskPublisher {
	once.Do(func() { publisher = new() })
	return publisher
}
