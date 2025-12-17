package auth

import (
	"backend/internal/config"
	"backend/internal/lib/gin_"
	"backend/internal/lib/utils"
	"backend/internal/models/collections"
	"backend/internal/models/schemas"
	"context"
	"net/http"
	"strings"
)

func GetUserFromToken(token string) (schemas.UserRead, error) {
	badToken := gin_.ApiError{
		Code:    http.StatusUnauthorized,
		Message: "Token Not Valid",
	}

	payload, err := utils.DecodePayload(token, config.Env.SecretKey)
	if err != nil {
		if strings.Contains(err.Error(), "token expired") {
			return schemas.UserRead{}, gin_.ApiError{
				Code:    http.StatusUnauthorized,
				Message: "Token Expired",
			}
		}
		return schemas.UserRead{}, badToken
	}

	userIdRaw, userFound := payload["userId"]
	emailRaw, emailFound := payload["email"]
	if !userFound || !emailFound {
		return schemas.UserRead{}, badToken
	}

	userId, userIdValid := userIdRaw.(string)
	email, emailValid := emailRaw.(string)
	if !userIdValid || !emailValid {
		return schemas.UserRead{}, badToken
	}

	uc := collections.GetUserCollection()
	ctx := context.Background()
	user, err := uc.GetById(userId, ctx)
	if err != nil {
		return schemas.UserRead{}, gin_.ApiError{
			Code:    http.StatusNotFound,
			Message: "user not found",
		}
	}

	if user.Email != email {
		return schemas.UserRead{}, gin_.ApiError{
			Code:    http.StatusBadRequest,
			Message: "Invalid token, payload corrupted",
		}
	}

	return user, nil
}
