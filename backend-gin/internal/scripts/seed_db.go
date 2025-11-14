package scripts

import (
	"backend/internal/models/examples"
)

func SeedDB() {
	examples.SeedDb(true)
}
