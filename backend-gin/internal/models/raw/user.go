//go:generate go run ../../../cmd/schemas_parser/main.go -in ./user.go -meta ../fields/user.yaml -out ../schemas/user.go

package raw

import "backend/internal/types_"

/////// Base Schemas /////////////

// schemas:tag
type UserBase struct {
	Name    any `tag:"name"`
	Email   any `tag:"email"`
	IsAdmin any `tag:"isAdmin"`
}

// schemas:tag
type UserSeed struct {
	UserBase
	Ref      int
	Password any `tag:"password"`
	ImageUrl any `tag:"imageUrl,optional"`
}

/////// Creation Schemas /////////////

// schemas:tag
type UserCreate struct {
	UserBase
	Password any `tag:"password"`
	ImageUrl any `tag:"imageUrl,optional"`
}

// schemas:tag
type UserPost struct {
	UserBase
	Password any `tag:"password"`
	Image    any `tag:"image,optional"`
}

/////// Read Schemas /////////////

// schemas:tag
type UserRead struct {
	UserBase
	Id       any `tag:"id"`
	ImageUrl any `tag:"imageUrl,optional"`
	Places   any `tag:"places"`
}

type UsersPaginated = types_.RecordsPaginated[PlaceRead]

/////// Query Schemas /////////////

// schemas:filters
type UserFilters struct {
	Id    any `tag:"id"`
	Name  any `tag:"name"`
	Email any `tag:"email"`
}

/////// Update Schemas /////////////

// schemas:tag
type UserUpdate struct {
	Name     any `tag:"name,optional"`
	Email    any `tag:"email,optional"`
	Password any `tag:"password,optional"`
}

// schemas:tag
type UserPut struct {
	UserUpdate
}
