package scripts

import (
	"backend/internal/models/collections"
	"context"
	"fmt"
)

func Debug() {
	uc := collections.NewUserCollection()
	u, err := uc.GetByEmail("mslimbejdi@gmail.com", context.Background())
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(u)
	}

}
