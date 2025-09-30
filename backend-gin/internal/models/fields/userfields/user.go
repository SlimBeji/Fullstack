package userfields

import (
	"backend/internal/models/fields"
	"mime/multipart"
)

//////// CRUD Config ///////

var UserSelectableFields = []string{
	"id",
	"name",
	"email",
	"isAdmin",
	"imageUrl",
	"places",
}

var UserSearchableFields = []string{
	"id",
	"name",
	"email",
}

var UserSortableFields = []string{
	"createdAt",
	"-createdAt",
	"name",
	"-name",
	"email",
	"-email",
}

//////// First Level Fields ///////

// The user ID, 24 characters
type ID struct {
	// example: 683b21134e2e5d46978daf1f
	fields.Field[string] `json:"id" validate:"hexadecimal,len=24"`
}

// The user name, two characters at least
type Name struct {
	// example: Slim Beji
	fields.Field[string] `json:"name" validate:"min=2"`
}

// The user email
type Email struct {
	// example: mslimbeji@gmail.com
	fields.Field[string] `json:"email" validate:"email"`
}

// The user password, 8 characters at least
type Password struct {
	// example: very_secret
	fields.Field[string] `json:"password" validate:"min=8"`
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

// Whether the user is an admin or not
type IsAdmin struct {
	// example: false
	fields.Field[bool] `json:"isAdmin"`
}

// The id of places belonging to the user, 24 characters
type Places struct {
	// example: ["683b21134e2e5d46978daf1f"]
	fields.Field[[]string] `json:"places" validate:"dive,hexadecimal,len=24"`
}
