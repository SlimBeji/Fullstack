package main

import (
	"fmt"
	"os"
)

func main() {
	input := os.Args[1]
	switch input {
	case "debug":
		Debug()
	case "seed":
		SeedDB()
	case "dump":
		DumpDb()
	default:
		fmt.Printf("Unknown script %s\n", input)
	}
}
