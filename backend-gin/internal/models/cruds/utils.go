// This module is used to avoid circular imports
// with cruds classes importing each others

package cruds

import (
	"backend/internal/models/orm"
	"context"

	"gorm.io/gorm"
)

func UserExists(ctx context.Context, db *gorm.DB, id int) (bool, error) {
	var count int64
	err := db.Model(&orm.User{}).WithContext(ctx).
		Where("id = ?", id).
		Limit(1).
		Count(&count).
		Error

	if err != nil {
		return false, err
	}

	return count > 0, nil
}
