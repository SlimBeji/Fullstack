package bin

import (
	"backend/internal/services/instances"
	"context"
	"fmt"
)

func TestPgsql() {
	// Get redis client
	ctx := context.Background()
	pgClient := instances.GetPgClient()
	defer pgClient.Close()

	// Extract list of tables
	tables, err := pgClient.ListTables(ctx)
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(tables)
	}
}
