package bin

import (
	"backend/internal/lib/setup"
	"backend/internal/models/examples"
)

func DumpDb() {
	setup := setup.New()
	defer setup.CloseSerives()
	examples.DumpDb(true)
}
