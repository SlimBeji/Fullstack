package publishers

import (
	"backend/internal/background/bgconfig"
	"encoding/json"
	"fmt"
	"testing"

	"github.com/hibiken/asynq"
)

func PlaceEmbedding(
	placeId uint, opts ...asynq.Option,
) (*asynq.TaskInfo, error) {
	if testing.Testing() {
		return nil, nil
	}

	data := bgconfig.PlaceEmbeddingData{PlaceId: placeId}
	payloadData, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("could not marshal place embedding data: %w", err)
	}

	opts = append(opts, asynq.Queue(string(bgconfig.QueuesAI)))
	tp := GetPublisher()
	return tp.NewTask(bgconfig.TaskPlaceEmbedding, payloadData, opts...)
}
