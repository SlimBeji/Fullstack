package crons

import "github.com/go-co-op/gocron/v2"

type JobConfig struct {
	Name  string
	Timer gocron.JobDefinition
	Task  gocron.Task
}
