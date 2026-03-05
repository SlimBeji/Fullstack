package cruds

import (
	"backend/internal/config"
	"backend/internal/models/orm"
	"backend/internal/models/schemas"
	"backend/internal/services/instances"

	"gorm.io/gorm"
)

type CRUDSUser struct {
	DB              *gorm.DB
	Model           *gorm.DB
	maxItemsPerPage int
	defaultSelect   []schemas.UserSelectables
	defaultOrderBy  []schemas.UserSortables
}

// Constructor, Properties & Helpers

func NewCRUDSUser() *CRUDSUser {
	db := instances.GetPgClient().DB
	return &CRUDSUser{
		DB:              db,
		Model:           db.Model(&orm.User{}),
		maxItemsPerPage: config.Env.MaxItemsPerPage,
		defaultSelect: []schemas.UserSelectables{
			schemas.UserSelectId,
			schemas.UserSelectName,
			schemas.UserSelectEmail,
			schemas.UserSelectIsAdmin,
			schemas.UserSelectImageUrl,
			schemas.UserSelectPlaces,
			schemas.UserSelectCreatedAt,
		},
		defaultOrderBy: []schemas.UserSortables{
			schemas.UserSortCreatedAtDesc,
		},
	}
}

func (cu *CRUDSUser) TableName() string {
	return "users"
}

func (cu *CRUDSUser) ModelName() string {
	return "User"
}

func (cu *CRUDSUser) MaxItemsPerPage() int {
	return cu.maxItemsPerPage
}

func (cu *CRUDSUser) DefaultOrderBy() []schemas.UserSortables {
	return cu.defaultOrderBy
}

func (cu *CRUDSUser) DefaultSelect() []schemas.UserSelectables {
	return cu.defaultSelect
}

// Serialization and Post-Processing

func (cu *CRUDSUser) ToRead(dbModel *orm.User) schemas.UserRead {
	return schemas.UserRead{
		ID:       dbModel.ID,
		Name:     dbModel.Name,
		Email:    dbModel.Email,
		IsAdmin:  dbModel.IsAdmin,
		ImageUrl: dbModel.ImageURL,
		//Places: Move from []uint to []UserPlace,
		CreatedAt: dbModel.CreatedAt,
	}
}
