package orm

import (
	"backend/internal/lib/gorm_"

	"github.com/pgvector/pgvector-go"
)

type Location struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type Place struct {
	gorm_.BaseModel

	// Fields
	Title       string           `gorm:"not null" json:"title"`
	Description string           `gorm:"not null" json:"description"`
	Address     string           `gorm:"not null" json:"address"`
	ImageURL    string           `gorm:"not null;default:''" json:"imageUrl"`
	Location    Location         `gorm:"not null;type:jsonb;serializer:json" json:"location"`
	Embedding   *pgvector.Vector `gorm:"type:vector(384)" json:"-"`

	// Foreign Keys
	CreatorID uint `gorm:"not null;index:idx_place_creator;type:integer" json:"creatorId"`
	Creator   User `gorm:"foreignKey:CreatorID;constraint:OnDelete:CASCADE" json:"creator"`
}

func (Place) TableName() string {
	return "places"
}
