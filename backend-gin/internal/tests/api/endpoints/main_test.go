package endpoints

import (
	"backend/internal/lib/clients"
	"backend/internal/models/collections"
	"backend/internal/models/schemas"
	"context"
	"fmt"
	"os"
	"testing"
)

const userEmail = "beji.slim@yahoo.fr"
const adminEmail = "mslimbeji@gmail.com"

func getToken(email string) (schemas.EncodedToken, error) {
	var zero schemas.EncodedToken
	uc := collections.GetUserCollection()
	token, err := uc.GetTokenPayload(email, context.Background())
	if err != nil {
		return zero, fmt.Errorf("Could not extract token for user %s", userEmail)
	}
	return token, nil
}

func getUser(email string) (schemas.UserRead, error) {
	var zero schemas.UserRead
	uc := collections.GetUserCollection()
	user, err := uc.GetByEmail(email, context.Background())
	if err != nil {
		return zero, fmt.Errorf("Could not extract user %s", email)
	}
	return user, nil
}

func TestMain(m *testing.M) {
	dbs := clients.GetDbs()
	code := m.Run()
	dbs.Close()
	os.Exit(code)
}
