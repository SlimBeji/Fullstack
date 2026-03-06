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

type CRUDSUser struct {
	DB              *gorm.DB
	Model           *gorm.DB
	maxItemsPerPage int
	defaultSelect   []string
	defaultOrderBy  []string
}

// Constructor, Properties & Helpers

func NewCRUDSUser() *CRUDSUser {
	db := instances.GetPgClient().DB
	return &CRUDSUser{
		DB:              db,
		Model:           db.Model(&orm.User{}),
		maxItemsPerPage: config.Env.MaxItemsPerPage,
		defaultSelect: []string{
			string(schemas.UserSelectId),
			string(schemas.UserSelectName),
			string(schemas.UserSelectEmail),
			string(schemas.UserSelectIsAdmin),
			string(schemas.UserSelectImageUrl),
			string(schemas.UserSelectPlaces),
			string(schemas.UserSelectCreatedAt),
		},
		defaultOrderBy: []string{
			string(schemas.UserSortCreatedAtDesc),
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

func (cu *CRUDSUser) DefaultSelect() []string {
	return cu.defaultSelect
}

func (cu *CRUDSUser) DefaultOrderBy() []string {
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

func (cu *CRUDSUser) BuildQuery(query types_.SearchQuery) (*gorm.DB, error) {
	return gorm_.BuildSelectQuery(cu, query)
}

// Read

func (cu *CRUDSUser) AuthGet(
	user *schemas.UserRead, query types_.SearchQuery,
) types_.SearchQuery {
	// User can only access their own profile in secure mode
	if query.Where == nil {
		query.Where = make(types_.WhereFilters)
	}
	query.Where["id"] = types_.EqFilters(user.ID)
	return query
}

func (cu *CRUDSUser) Read(id int) (*orm.User, error) {
	return gorm_.Read[orm.User](cu, id)
}
