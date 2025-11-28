package tasks

import (
	"backend/internal/lib/clients"
	"backend/internal/models/collections"
	"backend/internal/types_"
	"context"
	"encoding/json"
	"fmt"
	"testing"

	"github.com/hibiken/asynq"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Define Tasks, Types and Callers

type PlaceEmbeddingData struct {
	PlaceId string
}

func placeEmbeddingTask(ctx context.Context, data PlaceEmbeddingData) error {
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

func PlaceEmbedding(
	placeId string, opts ...asynq.Option,
) (*asynq.TaskInfo, error) {
	if testing.Testing() {
		return nil, nil
	}

	data := PlaceEmbeddingData{PlaceId: placeId}
	payload, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("could not marshal place embedding data: %w", err)
	}

	opts = append(opts, asynq.Queue(string(types_.QueuesAI)))
	tm := GetTaskManager()
	return tm.NewTask(types_.TasksPlaceEmbedding, payload, opts...)
}

// Handler

func HandlePlaceEmbedding(ctx context.Context, t *asynq.Task) error {
	var data PlaceEmbeddingData
	if err := json.Unmarshal(t.Payload(), &data); err != nil {
		return fmt.Errorf("could not unmarshal data for place embedding task: %w", err)
	}
	return placeEmbeddingTask(ctx, data)
}
