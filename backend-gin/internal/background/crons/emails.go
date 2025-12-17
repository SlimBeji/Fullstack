package crons

import (
	"backend/internal/background/tasks/publisher"
	"log"

	"github.com/go-co-op/gocron/v2"
)

func sendNewsletter(name string, email string) {
	_, err := publisher.SendNewsletter(name, email)
	if err != nil {
		log.Printf("Following error occured while triggering the SendNewsletter task: %s/n", err.Error())
	}
}

var SendNewsletterCron = JobConfig{
	Name:  "SendNewsletterCron",
	Timer: gocron.CronJob("0 * * * *", false),
	Task: gocron.NewTask(
		sendNewsletter, "Slim Beji", "mslimbjei@gmail.com",
	),
}
