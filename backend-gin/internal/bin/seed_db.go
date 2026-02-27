package bin

import (
	"backend/internal/models/examples"
	"backend/internal/services/setup"
)

func SeedDB() {
	setup := setup.New()
	defer setup.CloseServices()
	examples.SeedDb(true)
}
