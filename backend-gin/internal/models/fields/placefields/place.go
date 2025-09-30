package placefields

import (
	"backend/internal/models/fields"
	"mime/multipart"
)

//////// CRUD Config ///////

var PlaceSelectableFields = []string{
	"id",
	"title",
	"description",
	"address",
	"location.lat",
	"location.lng",
	"imageUrl",
	"creatorId",
}

var PlaceSearchableFields = []string{
	"id",
	"title",
	"description",
	"address",
	"creatorId",
	"locationLat",
	"locationLng",
}

var PlaceSortableFields = []string{
	"createdAt",
	"-createdAt",
	"title",
	"-title",
	"description",
	"-description",
	"address",
	"-address",
}

//////// First Level Fields ///////

// The ID of the place 24 characters
type ID struct {
	// example: 683b21134e2e5d46978daf1f
	fields.Field[string] `json:"id" validate:"hexadecimal,len=24"`
}

// The place title/name, 10 characters minimum
type Title struct {
	// example: Stamford Bridge
	fields.Field[string] `json:"title" validate:"min=10"`
}

// The place description, 10 characters minimum
type Description struct {
	// example: Stadium of Chelsea football club
	fields.Field[string] `json:"description" validate:"min=10"`
}

// Title + Description embedding
type Embedding struct {
	Value []float64 `json:"embedding" validate:"len=384"`
}

// local url on the storage
type ImageUrl struct {
	// example: avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg
	fields.Field[string] `json:"imageUrl"`
}

// User's profile image (JPEG)
type Image struct {
	// in: formData
	// swagger:file
	fields.Field[*multipart.FileHeader] `json:"image"`
}

// The place address
type Address struct {
	// example: Fulham road
	fields.Field[string] `json:"address" validate:"min=10"`
}

// The ID of the place creator, 24 characters
type CreatorID struct {
	// example: 683b21134e2e5d46978daf1f
	fields.Field[string] `json:"creatorId" validate:"hexadecimal,len=24"`
}

//////// Location Fields ///////

// The latitude of the place
type Lat struct {
	// example: 51.48180425016331
	fields.Field[float64] `json:"lat"`
}

// The longitude of the place
type Lng struct {
	// example: -0.19090418688755467
	fields.Field[float64] `json:"lng"`
}

// Location object (can be sent as JSON string)
type Location struct {
	Lat Lat `validate:"required"`
	Lng Lng `validate:"required"`
}
