package tasks

import (
	"backend/internal/types_"
	"context"
	"encoding/json"
	"fmt"
	"testing"

	"github.com/hibiken/asynq"
)

// Define Tasks, Types and Callers

type NewsletterData struct {
	Name  string
	Email string
}

func sendNewsletterTask(data NewsletterData) error {
	// not passing a context object for this dummy example
	message := fmt.Sprintf(
		"Newsletter Email sent to %s at following address: %s",
		data.Name,
		data.Email,
	)
	fmt.Println(message)
	return nil
}

func SendNewsletter(
	name string, email string, opts ...asynq.Option,
) (*asynq.TaskInfo, error) {
	if testing.Testing() {
		return nil, nil
	}

	data := NewsletterData{Name: name, Email: email}
	payload, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("could not marshal newsletter data: %w", err)
	}

	opts = append(opts, asynq.Queue(string(types_.QueueeEmails)))
	tm := GetTaskManager()
	return tm.NewTask(types_.TasksNewsletter, payload, opts...)
}

// Handler

func HandleSendingNewsletter(ctx context.Context, t *asynq.Task) error {
	var data NewsletterData
	if err := json.Unmarshal(t.Payload(), &data); err != nil {
		return fmt.Errorf("could not unmarshal data for newsletter task: %w", err)
	}
	return sendNewsletterTask(data)
}
