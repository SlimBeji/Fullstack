package schemas

import (
	"backend/internal/models/fields/userfields"
)

type User struct {
	ID       userfields.ID       `validate:"required"`
	Name     userfields.Name     `validate:"required"`
	Email    userfields.Email    `validate:"required"`
	IsAdmin  userfields.IsAdmin  `validate:"required"`
	ImageUrl userfields.ImageUrl `validate:"required"`
	Places   userfields.Places
}
