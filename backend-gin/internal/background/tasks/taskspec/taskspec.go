package taskspec

// Queues

type QueueType string

const (
	QueueeEmails QueueType = "emails"
	QueuesAI     QueueType = "ai"
)

var AllQueues = []QueueType{QueueeEmails, QueuesAI}

// Tasks & Payload

type TaskType string

const TaskNewsletter TaskType = "newsletter"

type NewsletterData struct {
	Name  string
	Email string
}

const TaskPlaceEmbedding TaskType = "place_embedding"

type PlaceEmbeddingData struct {
	PlaceId string
}
