package schemas

import (
	"backend/internal/config"
	"backend/internal/lib/types_"
	"backend/internal/lib/utils"
	"fmt"
	"mime/multipart"
	"net/http"
	"strings"
	"time"
)

type TokenPayload struct {
	UserId uint   `json:"user_id"`
	Email  string `json:"email" validate:"email"`
}

func TokenPayloadFromString(encoded string) (TokenPayload, error) {
	var zero TokenPayload
	badToken := types_.APIError{
		Code:    http.StatusUnauthorized,
		Message: "Token Not Valid",
	}

	payload, err := utils.DecodePayload(encoded, config.Env.SecretKey)
	if err != nil {
		if strings.Contains(err.Error(), "token expired") {
			return zero, types_.APIError{
				Code:    http.StatusUnauthorized,
				Message: "Token Expired",
			}
		}
		badToken.Err = err
		return zero, badToken
	}

	userIdRaw, userFound := payload["user_id"]
	emailRaw, emailFound := payload["email"]
	if !userFound || !emailFound {
		return zero, badToken
	}

	// Converting from string to uint
	userId, userIdValid := userIdRaw.(float64)
	email, emailValid := emailRaw.(string)

	if !userIdValid || !emailValid {
		return zero, badToken
	}

	return TokenPayload{
		UserId: uint(userId), Email: email,
	}, nil
}

type SignupForm struct {
	Name     string                `json:"name" form:"name" validate:"required,min=2" example:"Slim Beji"`             // The user name, two characters at least
	Email    string                `json:"email" form:"email" validate:"required,email" example:"mslimbeji@gmail.com"` // The user email
	Password string                `json:"password" form:"password" validate:"required,min=8" example:"very_secret"`   // The user password, 8 characters at least
	Image    *multipart.FileHeader `json:"image" form:"image" validate:"omitempty" swaggerignore:"true"`               // User's profile image (JPEG)
}

type SigninForm struct {
	Username string `json:"username" form:"username" validate:"required,email" example:"mslimbeji@gmail.com"` // The user email (We use username here because of OAuth spec)
	Password string `json:"password" form:"password" validate:"required,min=8" example:"very_secret"`         // The user password, 8 characters at least
}

type EncodedToken struct {
	AccessToken string `json:"access_token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODIyNDVhOWY2YTU5ZjVlNjM2Y2NmYjEiLCJlbWFpbCI6ImJlamkuc2xpbUB5YWhvby5mciIsImlhdCI6MTc0NzMzNjUxMCwiZXhwIjoxNzQ3MzQwMTEwfQ.C4DCJKvGWhpHClpqmxHyxKLPYDOZDUlr-LA_2IflTXM"` // A generated web token. The 'Bearer ' prefix needs to be added for authentication
	TokenType   string `json:"token_type" validate:"oneof=bearer" example:"bearer"`                                                                                                                                                                                            // The type of token. Only 'bearer' is supported.
	UserId      uint   `json:"user_id" example:"123456789"`                                                                                                                                                                                                                    // The user ID
	Email       string `json:"email" validate:"email" example:"mslimbeji@gmail.com"`                                                                                                                                                                                           // The user email
	ExpiresIn   int    `json:"expires_in" validate:"gt=0" example:"1751879562"`                                                                                                                                                                                                // The UNIX timestamp the token expires at
}

func CreateToken(id uint, email string) (EncodedToken, error) {
	payload := map[string]any{"user_id": id, "email": email}
	acccessToken, err := utils.EncodePayload(
		payload, config.Env.SecretKey, time.Duration(config.Env.JWTExpiration)*time.Second,
	)
	if err != nil {
		var zero EncodedToken
		return zero, fmt.Errorf("could not encode payload for user %d", id)
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
