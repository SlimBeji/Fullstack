package types_

type ContentType string

const (
	ContentTypeMultipart      ContentType = "multipart/form-data"
	ContentTypeFormUrlencoded ContentType = "application/x-www-form-urlencoded"
	ContentTypeJSON           ContentType = "application/json"
)

func (ct ContentType) IsValid() bool {
	switch ct {
	case ContentTypeMultipart, ContentTypeFormUrlencoded, ContentTypeJSON:
		return true
	default:
		return false
	}
}

type MimeType string

const (
	MimeTypeJPEG MimeType = "image/jpeg"
	MimeTypePNG  MimeType = "image/png"
)

func (mt MimeType) IsValid() bool {
	switch mt {
	case MimeTypeJPEG, MimeTypePNG:
		return true
	default:
		return false
	}
}
