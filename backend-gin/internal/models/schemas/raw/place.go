//go:generate go run ../../../../cmd/schemas_parser/main.go -in ./place.go -meta ../../fields/place.yaml -out ../place.go

package raw

import (
	"backend/internal/types_"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

/////// Nested Fields //////////////

// schemas:tag
type Location struct {
	Lat any `tag:"location.lat"`
	Lng any `tag:"location.lng"`
}

/////// Base Schemas /////////////

// schemas:tag
type PlaceDB struct {
	ID          primitive.ObjectID `tag:"id"`
	Title       any                `tag:"title"`
	Description any                `tag:"description"`
	Address     any                `tag:"address"`
	Location    Location           `tag:"location"`
	ImageUrl    any                `tag:"imageUrl,omitempty"`
	Embedding   any                `tag:"embedding"`
	CreatorID   primitive.ObjectID `tag:"creatorIdObj,json=creatorId"`
	CreatedAt   any                `tag:"createdAt"`
	UpdatedAt   any                `tag:"updatedAt"`
}

// schemas:tag
type PlaceSeed struct {
	Ref         int
	CreatorRef  int
	Title       any      `tag:"title"`
	Description any      `tag:"description"`
	Address     any      `tag:"address"`
	Location    Location `tag:"location"`
	Embedding   any      `tag:"embedding"`
	ImageUrl    any      `tag:"imageUrl,omitempty"`
}

/////// Creation Schemas /////////////

// schemas:tag
type PlaceCreate struct {
	Title       any                `tag:"title"`
	Description any                `tag:"description"`
	Address     any                `tag:"address"`
	Location    Location           `tag:"location"`
	Embedding   any                `tag:"embedding"`
	ImageUrl    any                `tag:"imageUrl,omitempty"`
	CreatorID   primitive.ObjectID `tag:"creatorIdObj,json=creatorId"`
}

// schemas:tag multipart
type PlacePost struct {
	Title       any `tag:"title"`
	Description any `tag:"description"`
	Address     any `tag:"address"`
	Lat         any `tag:"location.lat"`
	Lng         any `tag:"location.lng"`
	Image       any `tag:"image,omitempty"`
	CreatorID   any `tag:"creatorId"`
}

/////// Read Schemas /////////////

// schemas:tag
type PlaceRead struct {
	ID          any      `tag:"id"`
	Title       any      `tag:"title"`
	Description any      `tag:"description"`
	Address     any      `tag:"address"`
	Location    Location `tag:"location"`
	ImageUrl    any      `tag:"imageUrl,omitempty"`
	CreatorID   any      `tag:"creatorId"`
}

type PlacesPaginated = types_.RecordsPaginated[PlaceRead]

/////// Query Schemas /////////////

// schemas:filters
type PlaceFilters struct {
	Id          any `tag:"id"`
	Title       any `tag:"title"`
	Description any `tag:"description"`
	Address     any `tag:"address"`
	CreatorId   any `tag:"creatorId"`
	LocationLat any `tag:"location.lat,json=locationLat"`
	LocationLng any `tag:"location.lng,json=locationLng"`
}

/////// Update Schemas /////////////

// schemas:tag allownil
type PlaceUpdate struct {
	Title       any                `tag:"title"`
	Description any                `tag:"description"`
	Address     any                `tag:"address"`
	Location    Location           `tag:"location"`
	CreatorID   primitive.ObjectID `tag:"creatorIdObj,json=creatorId"`
}

// schemas:tag allownil
type PlacePut struct {
	Title       any      `tag:"title"`
	Description any      `tag:"description"`
	Address     any      `tag:"address"`
	Location    Location `tag:"location"`
	CreatorID   any      `tag:"creatorId"`
}
