package publisher

import (
	"backend/internal/background/tasks/taskspec"
	"encoding/json"
	"fmt"
	"testing"

	"github.com/hibiken/asynq"
)

func PlaceEmbedding(
	placeId string, opts ...asynq.Option,
) (*asynq.TaskInfo, error) {
	if testing.Testing() {
		return nil, nil
	}

	data := taskspec.PlaceEmbeddingData{PlaceId: placeId}
	payloadData, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("could not marshal place embedding data: %w", err)
	}

	opts = append(opts, asynq.Queue(string(taskspec.QueuesAI)))
	tp := GetPublisher()
	return tp.NewTask(taskspec.TaskPlaceEmbedding, payloadData, opts...)
}
