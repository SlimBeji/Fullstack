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

	// Prepare post form
	postForm := schemas.UserPost{
		Name:     "Frank Lampard",
		Email:    "frank.lampard@chelsea.com",
		IsAdmin:  true,
		Password: "blues is the color",
	}
	doc, err := uc.Create(&postForm, context.Background())
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(doc)
	}

	// Update the doc
	err = uc.Delete(doc.Id, context.Background())
	if err != nil {
		fmt.Println(err)
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
