package encryption

import (
	"backend/internal/config"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

const DEFAULT_HASH_SALT = 12

func HashInput(input string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword(
		[]byte(input), DEFAULT_HASH_SALT,
	)
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
	payload map[string]any, expiration ...time.Duration,
) (string, error) {
	tokenExp := time.Duration(config.Env.JWTExpiration) * time.Second
	if len(expiration) > 0 {
		tokenExp = expiration[0]
	}
	claims := jwt.MapClaims(payload)
	claims["exp"] = time.Now().Add(tokenExp).Unix()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.Env.SecretKey))
}

func DecodePayload(encoded string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(encoded, func(token *jwt.Token) (any, error) {
		return []byte(config.Env.SecretKey), nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}
	return nil, err
}
