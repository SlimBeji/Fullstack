package handler

import (
	"backend/internal/background/tasks/taskspec"
	"backend/internal/models/collections"
	"backend/internal/services/instances"
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/hibiken/asynq"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func HandlePlaceEmbedding(ctx context.Context, t *asynq.Task) error {
	var data taskspec.PlaceEmbeddingData
	if err := json.Unmarshal(t.Payload(), &data); err != nil {
		newErr := fmt.Errorf("could not unmarshal data for place embedding task: %w", err)
		log.Println(newErr.Error())
		return newErr
	}

	pc := collections.GetPlaceCollection()
	place, err := pc.GetById(data.PlaceId, ctx)
	if err != nil {
		newErr := fmt.Errorf("could not extract place with id %s", data.PlaceId)
		log.Println(newErr.Error())
		return newErr

	}
	text := fmt.Sprintf("%s - %s", place.Title, place.Description)
	hf := instances.GetHfClient()
	result, err := hf.EmbedText(text)
	if err != nil {
		newErr := fmt.Errorf(
			"could not run embedding of place %s with huggingface: %w",
			data.PlaceId,
			err,
		)
		log.Println(newErr.Error())
		return newErr
	}

	objId, err := primitive.ObjectIDFromHex(data.PlaceId)
	if err != nil {
		newErr := fmt.Errorf(
			"unexpected error: could not convert %s to objectId in place embdedding task",
			place.ID,
		)
		log.Println(newErr.Error())
		return newErr
	}
	filter := bson.M{"_id": objId}
	update := bson.M{"$set": bson.M{"embedding": result}}
	if _, err = pc.UpdateOne(ctx, filter, update); err != nil {
		newErr := fmt.Errorf(
			"could not update place %s embedding: %w",
			place.ID,
			err,
		)
		log.Println(newErr.Error())
		return newErr
	}

	fmt.Println(result)
	return nil
}
