package main

import (
	"backend/internal/scripts"
	"fmt"
	"os"
)

func main() {
	input := os.Args[1]
	switch input {
	case "debug":
		scripts.Debug()
	case "seed":
		scripts.SeedDB()
	case "dump":
		scripts.DumpDb()
	case "storage":
		scripts.TestStorage()
	default:
		fmt.Printf("Unknown script %s\n", input)
	}
}
