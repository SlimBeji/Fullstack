package gorm_

import "time"

type BaseModel struct {
	ID        uint      `gorm:"primaryKey;autoIncrement;type:serial" json:"id"`
	CreatedAt time.Time `gorm:"index;not null;default:CURRENT_TIMESTAMP;<-:create" json:"createdAt"`
	UpdatedAt time.Time `gorm:"not null;default:CURRENT_TIMESTAMP;autoUpdateTime" json:"updatedAt"`
}
