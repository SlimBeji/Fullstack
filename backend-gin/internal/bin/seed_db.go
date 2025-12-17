package bin

import (
	"backend/internal/lib/setup"
	"backend/internal/models/examples"
)

func SeedDB() {
	setup := setup.New()
	defer setup.CloseSerives()
	examples.SeedDb(true)
}
