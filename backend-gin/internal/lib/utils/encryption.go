package utils

import (
	"errors"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func HashInput(input string, salt int) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(input), salt)
	return string(bytes), err
}

func VerifyHash(plain, hashed string) bool {
	return bcrypt.CompareHashAndPassword(
		[]byte(hashed), []byte(plain),
	) == nil
}

func IsHashed(input string) bool {
	if len(input) != 60 {
		return false
	}

	return strings.HasPrefix(input, "$2a$") ||
		strings.HasPrefix(input, "$2b$") ||
		strings.HasPrefix(input, "$2y$")
}

func EncodePayload(
	payload map[string]any, secret string, expiration time.Duration,
) (string, error) {
	claims := jwt.MapClaims(payload)
	claims["exp"] = time.Now().Add(expiration).Unix()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func DecodePayload(encoded string, secret string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(encoded, func(token *jwt.Token) (any, error) {
		return []byte(secret), nil
	})
	if err != nil {
		if strings.Contains(err.Error(), "token is expired") {
			return nil, errors.New("token expired")
		}
		return nil, errors.New("token not valid")
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("token not valid")
}
