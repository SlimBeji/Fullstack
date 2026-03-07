package bin

import (
	"backend/internal/models/cruds"
	"backend/internal/services/setup"
	"fmt"
)

func Debug() {
	// Setup
	setup := setup.New()
	defer setup.CloseServices()

	// Get the collection
	cp := cruds.GetCRUDSPlace()
	place, err := cp.Get(uint(1), nil)
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(place)
	}
}
