package gorm_

import "time"

type Order = string

const (
	Asc  Order = "ASC"
	Desc Order = "DESC"
)

type OrderBy struct {
	Field string // SQL path: e.g. "(user.personal->>'age')::float"
	Order
}

type SelectField struct {
	Select  string // SQL path: "places.title" or "users.name"
	Preload string // GORM preload path: "Places" or "Places.Reviews" (empty if no preload needed)
	Level   int8   // Depth: 0 = parent, 1 = child, 2 = grandchild
}

type SelectionLoad struct {
	Preload string   // GORM preload path: "Places" or "Places.Reviews" (empty if no preload needed)
	Level   int8     // Depth: 0 = parent, 1 = child, 2 = grandchild
	Fields  []string // list of fields (e.g. id, title, description)
}

type BaseModelReader interface {
	GetId() uint
	GetCreatedAt() time.Time
	GetUpdatedAt() time.Time
}
