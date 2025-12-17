//go:generate go run ../../../cmd/schemas_parser/main.go -in ./auth.go -meta ../fields/auth.yaml -out ../schemas/auth.go

package raw

import (
	"backend/internal/config"
	"backend/internal/lib/utils"
	"fmt"
	"time"
)

// schemas:tag
type TokenPayload struct {
	UserId any `tag:"userId"`
	Email  any `tag:"email"`
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

// schemas:tag multipart
type SignupForm struct {
	Name     any `tag:"name"`
	Email    any `tag:"email"`
	Password any `tag:"password"`
	Image    any `tag:"image,omitempty"`
}

// schemas:tag multipart
type SigninForm struct {
	Username any `tag:"username" default:"mslimbeji@gmail.com"`
	Password any `tag:"password" default:"very_secret"`
}

// schemas:tag
type EncodedToken struct {
	AccessToken any `tag:"access_token"`
	TokenType   any `tag:"token_type"`
	UserId      any `tag:"userId"`
	Email       any `tag:"email"`
	ExpiresIn   any `tag:"expires_in"`
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
