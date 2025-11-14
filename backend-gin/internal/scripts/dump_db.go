package scripts

import (
	"backend/internal/models/examples"
)

func DumpDb() {
	examples.DumpDb(true)
}
