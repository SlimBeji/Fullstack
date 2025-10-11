package types_

type ContentType string

const (
	CONTENT_TYPE_MULTIPART ContentType = "multipart/form-data"
	CONTENT_TYPE_JSON      ContentType = "application/json"
)

type MimeType string

const (
	MIMETYPE_JPEG MimeType = "image/jpeg"
	MIMETYPE_PNG  MimeType = "image/png"
)

type Collections string

const (
	COLLECTION_USERS  Collections = "users"
	COLLECTION_PLACES Collections = "places"
)

type Queues string

const (
	QUEUES_EMAILS Queues = "emails"
	QUEUES_AI     Queues = "ai"
)

type Tasks string

const (
	TASKS_NEWSLETTER      Tasks = "newsletter"
	TASKS_PLACE_EMBEDDING Tasks = "place_embedding"
)
