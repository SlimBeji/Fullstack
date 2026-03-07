package bgconfig

type QueueType string

const (
	QueueeEmails QueueType = "emails"
	QueuesAI     QueueType = "ai"
)

var AllQueues = []string{string(QueueeEmails), string(QueuesAI)}
