package orm

import (
	"backend/internal/lib/gorm_"
)

type User struct {
	gorm_.BaseModel

	// Fields
	Name     string `gorm:"not null" json:"name"`
	Email    string `gorm:"not null;unique" json:"email"`
	Password string `gorm:"not null" json:"password"`
	ImageURL string `gorm:"not null;default:''" json:"image_url"`
	IsAdmin  bool   `gorm:"not null;default:false" json:"is_admin"`

	// Relationships
	Places []Place `gorm:"foreignKey:CreatorID;constraint:OnDelete:CASCADE" json:"places"`
}

func (User) TableName() string {
	return "users"
}
