package schemas

import (
	"backend/internal/config"
	"backend/internal/lib/utils"
	"fmt"
	"mime/multipart"
	"time"
)

type TokenPayload struct {
	UserId string `json:"userId" validate:"hexadecimal,len=24" example:"683b21134e2e5d46978daf1f" bson:"userId"` // The user ID, 24 characters
	Email  string `json:"email" validate:"email" example:"mslimbeji@gmail.com" bson:"email"`                     // The user email
}

func DecodeEncodedToken(encoded string) (TokenPayload, error) {
	var zero TokenPayload

	decoded, err := utils.DecodePayload(encoded, config.Env.SecretKey)
	if err != nil {
		return zero, fmt.Errorf(
			"token %s not valid, could not decode it: %w", encoded, err,
		)
	}

	userIdRaw, found := decoded["userId"]
	if !found {
		return zero, fmt.Errorf("token %s not valid, no userId found", encoded)
	}
	userId, ok := userIdRaw.(string)
	if !ok {
		return zero, fmt.Errorf(
			"token %s not valid, userId %s not valid", encoded, userIdRaw,
		)
	}

	emailRaw, found := decoded["email"]
	if !found {
		return zero, fmt.Errorf("token %s not valid, no email found", encoded)
	}
	email, ok := emailRaw.(string)
	if !ok {
		return zero, fmt.Errorf(
			"token %s not valid, email %s not valid", encoded, emailRaw,
		)
	}

	return TokenPayload{
		UserId: userId, Email: email,
	}, nil
}

type SignupForm struct {
	Name     string                `json:"name" form:"name" validate:"min=2" example:"Slim Beji" bson:"name"`                // The user name, two characters at least
	Email    string                `json:"email" form:"email" validate:"email" example:"mslimbeji@gmail.com" bson:"email"`   // The user email
	Password string                `json:"password" form:"password" validate:"min=10" example:"very_secret" bson:"password"` // The user password, 10 characters at least
	Image    *multipart.FileHeader `json:"image" form:"image" validate:"omitempty" bson:"image" swaggerignore:"true"`        // User's profile image (JPEG)
}

type SigninForm struct {
	Username string `json:"username" form:"username" validate:"email" default:"mslimbeji@gmail.com" bson:"username"` // The user email (We use username here because of OAuth spec)
	Password string `json:"password" form:"password" validate:"min=10" default:"very_secret" bson:"password"`        // The user password, 10 characters at least
}

type EncodedToken struct {
	AccessToken string `json:"access_token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODIyNDVhOWY2YTU5ZjVlNjM2Y2NmYjEiLCJlbWFpbCI6ImJlamkuc2xpbUB5YWhvby5mciIsImlhdCI6MTc0NzMzNjUxMCwiZXhwIjoxNzQ3MzQwMTEwfQ.C4DCJKvGWhpHClpqmxHyxKLPYDOZDUlr-LA_2IflTXM" bson:"access_token"` // A generated web token. The 'Bearer ' prefix needs to be added for authentication
	TokenType   string `json:"token_type" validate:"oneof=bearer" example:"bearer" bson:"token_type"`                                                                                                                                                                                              // The type of token. Only 'bearer' is supported.
	UserId      string `json:"userId" validate:"hexadecimal,len=24" example:"683b21134e2e5d46978daf1f" bson:"userId"`                                                                                                                                                                              // The user ID, 24 characters
	Email       string `json:"email" validate:"email" example:"mslimbeji@gmail.com" bson:"email"`                                                                                                                                                                                                  // The user email
	ExpiresIn   int    `json:"expires_in" example:"1751879562" bson:"expires_in"`                                                                                                                                                                                                                  // The UNIX timestamp the token expires at
}

func CreateToken(id string, email string) (EncodedToken, error) {
	payload := map[string]any{"userId": id, "email": email}
	acccessToken, err := utils.EncodePayload(
		payload, config.Env.SecretKey, time.Duration(config.Env.JWTExpiration)*time.Second,
	)
	if err != nil {
		var zero EncodedToken
		return zero, fmt.Errorf("could not encode payload for user %s", id)
	}

	return EncodedToken{
		AccessToken: acccessToken,
		TokenType:   "bearer",
		Email:       email,
		UserId:      id,
		ExpiresIn:   config.Env.JWTExpiration,
	}, nil
}
func (et *EncodedToken) Bearer() string {
	return fmt.Sprintf("Bearer %s", et.AccessToken)
}
