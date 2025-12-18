package crons

import (
	"backend/internal/lib/clients"
	"sync"
)

var AllJobs []clients.JobConfig = []clients.JobConfig{SendNewsletterCron}

var (
	once      sync.Once
	scheduler *clients.TaskScheduler
)

func GetScheduler() *clients.TaskScheduler {
	once.Do(func() { scheduler = clients.NewScheduler(AllJobs) })
	return scheduler
}
