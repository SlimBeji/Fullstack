//go:generate go run ../../../cmd/schemas_parser/main.go -in ./place.go -meta ../fields/place.yaml -out ../schemas/place.go

package raw

import (
	"backend/internal/types_"
)

/////// Nested Fields //////////////

// schemas:tag
type Location struct {
	Lat any `tag:"location.lat"`
	Lng any `tag:"location.lng"`
}

/////// Base Schemas /////////////

// schemas:tag
type PlaceBase struct {
	Title       any      `tag:"title"`
	Description any      `tag:"description"`
	Address     any      `tag:"address"`
	Location    Location `tag:"location"`
}

// schemas:tag
type PlacSeed struct {
	Ref        int
	CreatorRef int
	Embedding  any `tag:"embedding"`
	ImageUrl   any `tag:"imageUrl,optional"`
	PlaceBase
}

/////// Creation Schemas /////////////

// schemas:tag
type PlaceCreate struct {
	PlaceBase
	Embedding any `tag:"embedding"`
	ImageUrl  any `tag:"imageUrl,optional"`
	CreatorID any `tag:"creatorId"`
}

// schemas:tag
type PlacePost struct {
	PlaceBase
	Image     any `tag:"image,optional"`
	CreatorID any `tag:"creatorId"`
}

/////// Read Schemas /////////////

// schemas:tag
type PlaceRead struct {
	ID any `tag:"id"`
	PlaceBase
	ImageUrl  any `tag:"imageUrl,optional"`
	CreatorID any `tag:"creatorId"`
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

// schemas:tag
type PlaceUpdate struct {
	Title       any      `tag:"title,optional"`
	Description any      `tag:"description,optional"`
	Address     any      `tag:"address,optional"`
	Location    Location `tag:"location,optional"`
	CreatorID   any      `tag:"creatorId,optional"`
}

// schemas:tag
type PlacePut struct {
	PlaceUpdate
}
