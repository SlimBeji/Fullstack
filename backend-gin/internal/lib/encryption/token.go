package encryption

import (
	"backend/internal/config"
	"backend/internal/lib/utils"
	"backend/internal/models/schemas"
	"fmt"
	"time"
)

func DecodeEncodedToken(encoded string) (schemas.TokenPayload, error) {
	var zero schemas.TokenPayload

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

	return schemas.TokenPayload{
		UserId: userId, Email: email,
	}, nil
}

func CreateToken(id string, email string) (schemas.EncodedToken, error) {
	payload := map[string]any{"userId": id, "email": email}
	acccessToken, err := utils.EncodePayload(
		payload, config.Env.SecretKey, time.Duration(config.Env.JWTExpiration)*time.Second,
	)
	if err != nil {
		var zero schemas.EncodedToken
		return zero, fmt.Errorf("could not encode payload for user %s", id)
	}

	return schemas.EncodedToken{
		AccessToken: acccessToken,
		TokenType:   "bearer",
		Email:       email,
		UserId:      id,
		ExpiresIn:   config.Env.JWTExpiration,
	}, nil
}
