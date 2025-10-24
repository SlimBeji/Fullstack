package scripts

import (
	"backend/internal/models/collections"
	"backend/internal/types_"
	"context"
	"fmt"
)

func Debug() {
	uc := collections.NewUserCollection()
	admin, err := uc.GetByEmail("beji.slim@yahoo.fr", context.Background())
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(admin)
	}

	namefilters := []types_.Filter{{Op: "regex", Val: "Slim"}}
	filters := types_.FindQueryFilters{"name": namefilters}
	sort := []string{"-email"}
	fields := []string{"email"}
	query := types_.FindQuery{
		Filters: filters,
		Fields:  fields,
		Sort:    sort,
		Page:    1,
		Size:    1,
	}
	page, err := uc.FetchBsonPage(&query, context.Background())
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(page)
	}
}
