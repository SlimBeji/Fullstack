package bgconfig

type TaskType string

const TaskNewsletter TaskType = "newsletter"

type NewsletterData struct {
	Name  string
	Email string
}

const TaskPlaceEmbedding TaskType = "place_embedding"

type PlaceEmbeddingData struct {
	PlaceId uint
}

var AllTasks = []TaskType{TaskNewsletter, TaskPlaceEmbedding}
