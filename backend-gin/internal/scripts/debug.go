package scripts

import (
	"backend/internal/models/collections"
	"backend/internal/models/schemas"
	"context"
	"fmt"
)

func Debug() {
	// Get the collection
	uc := collections.NewUserCollection()

	admin, err := uc.GetByEmail("mslimbeji@gmail.com", context.Background())
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(admin)
	}

	// Prepare update form
	name := "Super Frank"
	email := "super.frank.lampard@chelsea.com"
	putForm := schemas.UserPut{Name: &name, Email: &email}

	// Update the doc
	raw, err := uc.UserUpdateById(
		&admin, "68fc94b4d8776090be5fe670", &putForm, context.Background(),
	)
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(raw)
	}

	// namefilters := []types_.Filter{{Op: "regex", Val: "Slim"}}
	// filters := types_.FindQueryFilters{"name": namefilters}
	// sort := []string{"-email"}
	// fields := []string{"email"}
	// query := types_.FindQuery{
	// 	Filters: filters,
	// 	Fields:  fields,
	// 	Sort:    sort,
	// 	Page:    1,
	// 	Size:    1,
	// }
	// page, err := uc.FetchBsonPage(&query, context.Background())
}
