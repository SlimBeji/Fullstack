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
	Table    string // The table name
	Select   string // SQL path: "places.title" or "users.name"
	JoinStmt string // Full JOIN: "LEFT JOIN places ON users.id = places.creator_id"
}

type BaseModelReader interface {
	GetId() uint
	GetCreatedAt() time.Time
	GetUpdatedAt() time.Time
}
