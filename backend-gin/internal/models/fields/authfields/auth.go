package authfields

import "backend/internal/models/fields"

// The user email (We use username here because of OAuth spec)
type Username struct {
	// example: mslimbeji@gmail.com
	fields.Field[string] `json:"username" validate:"email"`
}

// A generated web token. The 'Bearer ' prefix needs to be added for authentication
type AccessToken struct {
	// example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
	fields.Field[string] `json:"access_token"`
}

// The type of token. Only 'bearer' is supported.
type TokenType struct {
	// example: bearer
	fields.Field[string] `json:"token_type" validate:"eq=bearer"`
}

// The UNIX timestamp the token expires at
type ExpiresIn struct {
	// example: 1751879562
	fields.Field[int] `json:"expires_in"`
}
