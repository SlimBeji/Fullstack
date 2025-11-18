package endpoints

import (
	"backend/internal/lib/clients"
	"os"
	"testing"
)

func TestMain(m *testing.M) {
	dbs := clients.GetDbs()
	code := m.Run()
	dbs.Close()
	os.Exit(code)
}
