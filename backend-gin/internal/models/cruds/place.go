package cruds

import (
	"backend/internal/config"
	"backend/internal/models/orm"
	"backend/internal/models/schemas"
	"backend/internal/services/instances"

	"gorm.io/gorm"
)

type CRUDSPlace struct {
	DB              *gorm.DB
	Model           *gorm.DB
	maxItemsPerPage int
	defaultSelect   []schemas.PlaceSelectables
	defaultOrderBy  []schemas.PlaceSortables
}

// Constructor, Properties & Helpers

func NewCRUDSPlace() *CRUDSPlace {
	db := instances.GetPgClient().DB
	return &CRUDSPlace{
		DB:              db,
		Model:           db.Model(&orm.User{}),
		maxItemsPerPage: config.Env.MaxItemsPerPage,
		defaultSelect: []schemas.PlaceSelectables{
			schemas.PlaceSelectId,
			schemas.PlaceSelectTitle,
			schemas.PlaceSelectDescription,
			schemas.PlaceSelectAddress,
			schemas.PlaceSelectLocation,
			schemas.PlaceSelectImageUrl,
			schemas.PlaceSelectCreatorId,
			schemas.PlaceSelectCreatedAt,
		},
		defaultOrderBy: []schemas.PlaceSortables{
			schemas.PlaceSortCreatedAtDesc,
		},
	}
}

func (cp *CRUDSPlace) TableName() string {
	return "places"
}

func (cp *CRUDSPlace) ModelName() string {
	return "Place"
}

func (cp *CRUDSPlace) MaxItemsPerPage() int {
	return cp.maxItemsPerPage
}

func (cp *CRUDSPlace) DefaultOrderBy() []schemas.PlaceSortables {
	return cp.defaultOrderBy
}

func (cp *CRUDSPlace) DefaultSelect() []schemas.PlaceSelectables {
	return cp.defaultSelect
}
