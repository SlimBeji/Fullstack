package types_

type ContentType string

const (
	ContentTypeMultipart      ContentType = "multipart/form-data"
	ContentTypeFormUrlencoded ContentType = "application/x-www-form-urlencoded"
	ContentTypeJson           ContentType = "application/json"
)

type MimeType string

const (
	MimetypeJPEG MimeType = "image/jpeg"
	MimetypePNG  MimeType = "image/png"
)

type Collections string

const (
	CollectionUsers  Collections = "users"
	CollectionPlaces Collections = "places"
)

var AllCollections = []Collections{CollectionUsers, CollectionPlaces}
