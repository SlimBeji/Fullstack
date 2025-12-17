package publisher

import (
	"backend/internal/background/tasks/taskspec"
	"encoding/json"
	"fmt"
	"testing"

	"github.com/hibiken/asynq"
)

func SendNewsletter(
	name string, email string, opts ...asynq.Option,
) (*asynq.TaskInfo, error) {
	if testing.Testing() {
		return nil, nil
	}

	data := taskspec.NewsletterData{Name: name, Email: email}
	payload, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("could not marshal newsletter data: %w", err)
	}

	opts = append(opts, asynq.Queue(string(taskspec.QueueeEmails)))
	tp := GetPublisher()
	return tp.NewTask(taskspec.TaskNewsletter, payload, opts...)
}
