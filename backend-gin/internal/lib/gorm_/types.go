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
	Select   string // SQL path: "places.title" or "users.name"
	JoinPath string // GORM relation: "Places" or "Creator" or "Places.Reviews"
}

type BaseModelReader interface {
	GetId() uint
	GetCreatedAt() time.Time
	GetUpdatedAt() time.Time
}
