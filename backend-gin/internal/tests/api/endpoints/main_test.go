package endpoints

import (
	"backend/internal/models/cruds"
	"backend/internal/models/schemas"
	"backend/internal/services/setup"
	"context"
	"fmt"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
)

const userEmail = "beji.slim@yahoo.fr"
const adminEmail = "mslimbeji@gmail.com"

func getUser(email string) (schemas.UserRead, error) {
	var zero schemas.UserRead
	cu := cruds.GetCRUDSUser()
	user, err := cu.GetByEmail(context.Background(), email)
	if err != nil {
		return zero, fmt.Errorf("Could not extract user %s", email)
	}
	return user, nil
}

func getToken(email string) (schemas.EncodedToken, error) {
	var zero schemas.EncodedToken

	user, err := getUser(email)
	if err != nil {
		return zero, err
	}

	token, err := schemas.CreateToken(user.ID, email)
	if err != nil {
		return zero, fmt.Errorf("Could not extract token for user %s", userEmail)
	}
	return token, nil
}

func TestMain(m *testing.M) {
	gin.SetMode(gin.ReleaseMode)
	setup := setup.New()
	code := m.Run()
	setup.CloseServices()
	os.Exit(code)
}
