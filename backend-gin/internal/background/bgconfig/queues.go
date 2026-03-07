package bgconfig

type QueueType string

const (
	QueueeEmails QueueType = "emails"
	QueuesAI     QueueType = "ai"
)

var AllQueues = []QueueType{QueueeEmails, QueuesAI}
