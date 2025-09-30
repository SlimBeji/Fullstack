package schemas

import (
	"backend/internal/models/fields/placefields"
)

type Place struct {
	ID          placefields.ID          `validate:"required"`
	Title       placefields.Title       `validate:"required"`
	Description placefields.Description `validate:"required"`
	Address     placefields.Address     `validate:"required"`
	Location    placefields.Location    `validate:"required"`
	ImageUrl    placefields.ImageUrl
	CreatorID   placefields.CreatorID `validate:"required"`
}
