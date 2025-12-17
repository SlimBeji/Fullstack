package publishers

import (
	"backend/internal/background"
	"backend/internal/config"
	"strings"
	"sync"

	"github.com/hibiken/asynq"
)

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

// Singleteon pattern

var (
	once      sync.Once
	publisher *TaskPublisher
)

func GetPublisher() *TaskPublisher {
	once.Do(func() { publisher = NewPublisher(config.Env.RedisURL) })
	return publisher
}
