package crons

import (
	"backend/internal/lib/clients"
	"sync"
)

var GetScheduler = sync.OnceValue(func() *clients.TaskScheduler {
	allJobs := []clients.JobConfig{SendNewsletterCron}
	return clients.NewScheduler(allJobs)
})
