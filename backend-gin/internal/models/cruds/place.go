package cruds

import (
	"backend/internal/config"
	"backend/internal/lib/gorm_"
	"backend/internal/lib/types_"
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
	defaultSelect   []string
	defaultOrderBy  []string
}

// Constructor, Properties & Helpers

func NewCRUDSPlace() *CRUDSPlace {
	db := instances.GetPgClient().DB
	return &CRUDSPlace{
		DB:              db,
		Model:           db.Model(&orm.User{}),
		maxItemsPerPage: config.Env.MaxItemsPerPage,
		defaultSelect: []string{
			string(schemas.PlaceSelectId),
			string(schemas.PlaceSelectTitle),
			string(schemas.PlaceSelectDescription),
			string(schemas.PlaceSelectAddress),
			string(schemas.PlaceSelectLocation),
			string(schemas.PlaceSelectImageUrl),
			string(schemas.PlaceSelectCreatorId),
			string(schemas.PlaceSelectCreatedAt),
		},
		defaultOrderBy: []string{
			string(schemas.PlaceSortCreatedAtDesc),
		},
	}
}

func (cp *CRUDSPlace) GetModel() *gorm.DB {
	return cp.Model
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

func (cp *CRUDSPlace) DefaultSelect() []string {
	return cp.defaultSelect
}

func (cp *CRUDSPlace) DefaultOrderBy() []string {
	return cp.defaultOrderBy
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

func (cp *CRUDSPlace) BuildQuery(query types_.SearchQuery) (*gorm.DB, error) {
	return gorm_.BuildSelectQuery(cp, query)
}

// Read

func (cp *CRUDSPlace) Read(id int) (*orm.Place, error) {
	return gorm_.Read[orm.Place](cp, id)
}
