package bin

import (
	"backend/internal/models/examples"
	"backend/internal/services/setup"
)

func DumpDb() {
	setup := setup.New()
	defer setup.CloseSerives()
	examples.DumpDb(true)
}
