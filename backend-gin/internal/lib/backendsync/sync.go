package backendsync

import (
	"backend/internal/lib/clients"
	"backend/internal/models/examples"
)

func StartAll() {
	clients.GetDbs()
}

func CloseAll() {
	clients.GetDbs().Close()
}

func SeedTestData() {
	examples.DumpDb()
	examples.SeedDb()
}
