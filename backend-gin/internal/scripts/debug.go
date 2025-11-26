package scripts

import (
	"backend/internal/models/collections"
	"backend/internal/models/schemas"
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
)

func Debug() {
	// Get the collection
	uc := collections.GetUserCollection()

	admin, err := uc.GetByEmail("mslimbeji@gmail.com", context.Background())
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(admin)
	}

	// Prepare put form
	password := "chelsea"
	updateForm := schemas.UserPut{
		Password: &password,
	}
	uc.Update(
		bson.M{"email": "frank.lampard@chelsea.com"},
		&updateForm,
		context.Background(),
	)

	// Signin
	signin := schemas.SigninForm{
		Username: "frank.lampard@chelsea.com",
		Password: "chelsea",
	}
	doc, err := uc.Signin(&signin, context.Background())
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(doc)
	}
}
