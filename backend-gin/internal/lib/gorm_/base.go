package gorm_

import "time"

type BaseModel struct {
	ID        uint      `gorm:"primaryKey;autoIncrement;type:serial" json:"id"`
	CreatedAt time.Time `gorm:"index;not null;default:CURRENT_TIMESTAMP;<-:create" json:"created_at"`
	UpdatedAt time.Time `gorm:"not null;default:CURRENT_TIMESTAMP;autoUpdateTime" json:"updated_at"`
}

func (bm BaseModel) GetId() uint {
	return bm.ID
}

func (bm BaseModel) GetCreatedAt() time.Time {
	return bm.CreatedAt
}

func (bm BaseModel) GetUpdatedAt() time.Time {
	return bm.UpdatedAt
}
