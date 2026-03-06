package cruds

import (
	"backend/internal/config"
	"backend/internal/lib/gorm_"
	"backend/internal/lib/utils"
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

// Serialization and Post-Processing

func (cp *CRUDSPlace) ToRead(dbModel *orm.Place) schemas.PlaceRead {
	return schemas.PlaceRead{
		ID:          dbModel.ID,
		Title:       dbModel.Title,
		Description: dbModel.Description,
		Address:     dbModel.Address,
		Location: schemas.Location{
			Lat: dbModel.Location.Lat,
			Lng: dbModel.Location.Lng,
		},
		ImageUrl:  dbModel.ImageURL,
		CreatorID: dbModel.CreatorID,
		CreatedAt: dbModel.CreatedAt,
	}
}

func (cp *CRUDSPlace) PostProcess(read *schemas.PlaceRead) error {
	if read.ImageUrl == "" {
		return nil
	}

	storage := instances.GetStorage()
	signedUrl, err := storage.GetSignedURL(read.ImageUrl, config.Env.JWTExpiration)
	if err != nil {
		return err
	}

	read.ImageUrl = signedUrl
	return nil
}

func (cp *CRUDSPlace) PostProcessPartial(partial map[string]any) error {
	imageUrl, exists := partial["imageUrl"]
	if !exists {
		return nil
	}

	storage := instances.GetStorage()
	signedUrl, err := storage.GetSignedURL(imageUrl.(string), config.Env.JWTExpiration)
	if err != nil {
		return err
	}

	partial["imageUrl"] = signedUrl
	return nil
}

// Query Building

func (cp *CRUDSPlace) MapSelect(field string) []gorm_.SelectField {
	return []gorm_.SelectField{
		{Select: cp.TableName() + "." + utils.CamelToSnake(field), JoinPath: ""},
	}
}

func (cp *CRUDSPlace) MapOrderBy(field string) string {
	return cp.TableName() + "." + utils.CamelToSnake(field)
}

func (cp *CRUDSPlace) MapWhere(field string) string {
	switch field {
	case string(schemas.PlaceSearchLocationLat):
		return "(location->>'lat')::float"
	case string(schemas.PlaceSearchLocationLng):
		return "(location->>'lng')::float"
	default:
		return cp.TableName() + "." + utils.CamelToSnake(field)
	}
}
