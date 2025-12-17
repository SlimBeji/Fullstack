package crons

import (
	"fmt"
	"sync"

	"github.com/go-co-op/gocron/v2"
)

type JobConfig struct {
	Name  string
	Timer gocron.JobDefinition
	Task  gocron.Task
}

var AllJobs []JobConfig = []JobConfig{SendNewsletterCron}

type TaskScheduler struct {
	scheduler gocron.Scheduler
}

func new() *TaskScheduler {
	scheduler, err := gocron.NewScheduler()
	if err != nil {
		panic(fmt.Errorf(
			"could not create scheduler: %w", err,
		))
	}

	for _, jc := range AllJobs {
		if _, err := scheduler.NewJob(jc.Timer, jc.Task); err != nil {
			panic(fmt.Errorf(
				"could not register job %s to scheduler: %w", jc.Name, err,
			))
		}
	}
	scheduler.Start()
	return &TaskScheduler{scheduler: scheduler}
}

func (ts *TaskScheduler) Close() {
	ts.scheduler.Shutdown()
}

// Singleton pattern

var (
	once      sync.Once
	scheduler *TaskScheduler
)

func GetScheduler() *TaskScheduler {
	once.Do(func() { scheduler = new() })
	return scheduler
}
