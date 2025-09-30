package schemas

import (
	"backend/internal/models/fields/authfields"
	"backend/internal/models/fields/userfields"
)

type AccessToken struct {
	AccessToken authfields.AccessToken `json:"access_token"`
	TokenType   authfields.TokenType   `json:"token_type"`
	UserID      userfields.ID          `json:"userId"`
	Email       userfields.Email       `json:"email"`
	ExpiresIn   authfields.ExpiresIn   `json:"expires_in"`
}
