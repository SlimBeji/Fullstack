package handlers

import (
	"backend/internal/background/tasks/taskspec"
	"context"
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
)

func HandleSendingNewsletter(ctx context.Context, t *asynq.Task) error {
	var data taskspec.NewsletterData
	if err := json.Unmarshal(t.Payload(), &data); err != nil {
		return fmt.Errorf("could not unmarshal data for newsletter task: %w", err)
	}

	message := fmt.Sprintf(
		"Newsletter Email sent to %s at following address: %s",
		data.Name,
		data.Email,
	)
	fmt.Println(message)
	return nil
}
