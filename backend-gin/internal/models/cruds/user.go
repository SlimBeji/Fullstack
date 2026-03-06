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

func (cu *CRUDSUser) GetModel() *gorm.DB {
	return cu.Model
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

func (cu *CRUDSUser) DefaultSelect() []schemas.UserSelectables {
	return cu.defaultSelect
}

func (cu *CRUDSUser) DefaultOrderBy() []schemas.UserSortables {
	return cu.defaultOrderBy
}

// Serialization and Post-Processing

func (cu *CRUDSUser) ToRead(dbModel *orm.User) schemas.UserRead {
	places := make([]schemas.UserPlace, 0, len(dbModel.Places))
	for _, place := range dbModel.Places {
		places = append(places, schemas.UserPlace{
			ID:      place.ID,
			Title:   place.Title,
			Address: place.Address,
		})
	}

	return schemas.UserRead{
		ID:        dbModel.ID,
		Name:      dbModel.Name,
		Email:     dbModel.Email,
		IsAdmin:   dbModel.IsAdmin,
		ImageUrl:  dbModel.ImageURL,
		Places:    places,
		CreatedAt: dbModel.CreatedAt,
	}
}

func (cu *CRUDSUser) PostProcess(read *schemas.UserRead) error {
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

func (cu *CRUDSUser) PostProcessPartial(partial map[string]any) error {
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

func (cu *CRUDSUser) MapSelect(field string) []gorm_.SelectField {
	switch field {
	case string(schemas.UserSelectPlaces):
		return []gorm_.SelectField{
			{Select: "users.id", JoinPath: ""},
			{Select: "places.id", JoinPath: "Places"},
			{Select: "places.title", JoinPath: "Places"},
			{Select: "places.address", JoinPath: "Places"},
		}

	default:
		return []gorm_.SelectField{
			{Select: cu.TableName() + "." + utils.CamelToSnake(field), JoinPath: ""},
		}
	}
}

func (cu *CRUDSUser) MapOrderBy(field string) string {
	return cu.TableName() + "." + utils.CamelToSnake(field)
}

func (cu *CRUDSUser) MapWhere(field string) string {
	return cu.TableName() + "." + utils.CamelToSnake(field)
}
