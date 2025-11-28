package handler

import (
	"backend/internal/lib/clients"
	"backend/internal/models/collections"
	"backend/internal/worker/tasks/taskspec"
	"context"
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func HandlePlaceEmbedding(ctx context.Context, t *asynq.Task) error {
	var data taskspec.PlaceEmbeddingData
	if err := json.Unmarshal(t.Payload(), &data); err != nil {
		return fmt.Errorf("could not unmarshal data for place embedding task: %w", err)
	}

	pc := collections.GetPlaceCollection()
	place, err := pc.GetById(data.PlaceId, ctx)
	if err != nil {
		return fmt.Errorf(
			"could not extract place with id %s", data.PlaceId,
		)
	}
	text := fmt.Sprintf("%s - %s", place.Title, place.Description)
	hf := clients.NewHuggingFaceClient()
	result, err := hf.EmbedText(text)
	if err != nil {
		return fmt.Errorf(
			"could not run embedding of place %s with huggingface: %w",
			data.PlaceId,
			err,
		)
	}

	objId, err := primitive.ObjectIDFromHex(data.PlaceId)
	if err != nil {
		return fmt.Errorf(
			"unexpected error: could not convert %s to objectId in place embdedding task",
			place.ID,
		)
	}
	filter := bson.M{"_id": objId}
	update := bson.M{"embedding": result}
	if _, err = pc.UpdateOne(ctx, filter, update); err != nil {
		return fmt.Errorf(
			"could not update place %s embedding: %w",
			place.ID,
			err,
		)
	}

	fmt.Println(result)
	return nil
}
