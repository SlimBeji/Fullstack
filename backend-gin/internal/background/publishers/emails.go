package publishers

import (
	"backend/internal/background"
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

	data := background.NewsletterData{Name: name, Email: email}
	payload, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("could not marshal newsletter data: %w", err)
	}

	opts = append(opts, asynq.Queue(string(background.QueueeEmails)))
	tp := GetPublisher()
	return tp.NewTask(background.TaskNewsletter, payload, opts...)
}
