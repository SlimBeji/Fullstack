package main

import (
	"backend/internal/bin"
	"fmt"
	"os"
)

func main() {
	input := os.Args[1]
	switch input {
	case "debug":
		bin.Debug()
	case "seed":
		bin.SeedDB()
	case "dump":
		bin.DumpDb()
	case "storage":
		bin.TestStorage()
	case "redis":
		bin.TestRedis()
	case "hf":
		bin.TestHuggingFace()
	default:
		fmt.Printf("Unknown script %s\n", input)
	}
}
