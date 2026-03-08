package handlers

import (
	"backend/internal/background/bgconfig"
	"backend/internal/models/cruds"
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/hibiken/asynq"
)

func HandlePlaceEmbedding(ctx context.Context, t *asynq.Task) error {
	var data bgconfig.PlaceEmbeddingData
	if err := json.Unmarshal(t.Payload(), &data); err != nil {
		newErr := fmt.Errorf("could not unmarshal data for place embedding task: %w", err)
		log.Println(newErr.Error())
		return newErr
	}

	cp := cruds.GetCRUDSPlace()
	result, err := cp.Embed(ctx, data.PlaceId)
	if err != nil {
		newErr := fmt.Errorf(
			"could not run embedding of place %d with huggingface: %w",
			data.PlaceId,
			err,
		)
		log.Println(newErr.Error())
		return newErr
	}
	fmt.Println(result)
	return nil
}
