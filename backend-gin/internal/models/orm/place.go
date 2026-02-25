package orm

import (
	"backend/internal/lib/gorm_"

	"github.com/pgvector/pgvector-go"
)

type Place struct {
	gorm_.BaseModel

	// Fields
	Title       string           `gorm:"not null" json:"title"`
	Description string           `gorm:"not null" json:"description"`
	Address     string           `gorm:"not null" json:"address"`
	ImageURL    string           `gorm:"not null" json:"imageUrl"`
	Location    map[string]any   `gorm:"not null;type:jsonb;serializer:json" json:"location"`
	Embedding   *pgvector.Vector `gorm:"type:vector(384)" json:"-"`

	// Foreign Keys
	CreatorID uint `gorm:"not null;index:idx_place_creator" json:"creatorId"`
	Creator   User `gorm:"foreignKey:CreatorID;constraint:OnDelete:CASCADE" json:"creator"`
}

func (Place) TableName() string {
	return "places"
}
