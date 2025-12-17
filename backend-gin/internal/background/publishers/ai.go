package publishers

import (
	"backend/internal/background"
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

	data := background.PlaceEmbeddingData{PlaceId: placeId}
	payloadData, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("could not marshal place embedding data: %w", err)
	}

	opts = append(opts, asynq.Queue(string(background.QueuesAI)))
	tp := GetPublisher()
	return tp.NewTask(background.TaskPlaceEmbedding, payloadData, opts...)
}
