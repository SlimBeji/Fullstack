//go:generate go run ../../../cmd/schemas_parser/main.go -in ./user.go -meta ../fields/user.yaml -out ../schemas/user.go

package raw

import "backend/internal/types_"

/////// Base Schemas /////////////

// schemas:tag
type UserDB struct {
	Id       any `tag:"id"`
	Name     any `tag:"name"`
	Email    any `tag:"email"`
	IsAdmin  any `tag:"isAdmin"`
	Password any `tag:"password"`
	ImageUrl any `tag:"imageUrl,omitempty"`
	Places   any `tag:"places"`
}

// schemas:tag
type UserSeed struct {
	Ref      int
	Name     any `tag:"name"`
	Email    any `tag:"email"`
	IsAdmin  any `tag:"isAdmin"`
	Password any `tag:"password"`
	ImageUrl any `tag:"imageUrl,omitempty"`
}

/////// Creation Schemas /////////////

// schemas:tag
type UserCreate struct {
	Name     any `tag:"name"`
	Email    any `tag:"email"`
	IsAdmin  any `tag:"isAdmin"`
	Password any `tag:"password"`
	ImageUrl any `tag:"imageUrl,omitempty"`
}

// schemas:tag
type UserPost struct {
	Name     any `tag:"name" form:"name"`
	Email    any `tag:"email" form:"email"`
	IsAdmin  any `tag:"isAdmin" form:"isAdmin"`
	Password any `tag:"password" form:"password"`
	Image    any `tag:"image,omitempty" form:"image"`
}

/////// Read Schemas /////////////

// schemas:tag
type UserRead struct {
	Id       any `tag:"id"`
	Name     any `tag:"name"`
	Email    any `tag:"email"`
	IsAdmin  any `tag:"isAdmin"`
	ImageUrl any `tag:"imageUrl,omitempty"`
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

// schemas:tag omitall
type UserUpdate struct {
	Name     any `tag:"name"`
	Email    any `tag:"email"`
	Password any `tag:"password"`
}

// schemas:tag
type UserPut struct {
	UserUpdate
}
