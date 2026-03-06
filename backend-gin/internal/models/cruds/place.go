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

type PlaceOptions struct {
	Fields  []string
	Process bool
}

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
			string(schemas.PlaceSelectImageURL),
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
		ImageURL:  dbModel.ImageURL,
		CreatorID: dbModel.CreatorID,
		CreatedAt: dbModel.CreatedAt,
	}
}

func (cp *CRUDSPlace) PostProcess(read *schemas.PlaceRead) error {
	if read.ImageURL == "" {
		return nil
	}

	storage := instances.GetStorage()
	signedURL, err := storage.GetSignedURL(read.ImageURL, config.Env.JWTExpiration)
	if err != nil {
		return err
	}

	read.ImageURL = signedURL
	return nil
}

func (cp *CRUDSPlace) PostProcessPartial(partial map[string]any) error {
	imageURL, exists := partial["imageUrl"]
	if !exists {
		return nil
	}

	storage := instances.GetStorage()
	signedURL, err := storage.GetSignedURL(imageURL.(string), config.Env.JWTExpiration)
	if err != nil {
		return err
	}

	partial["imageUrl"] = signedURL
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

func (cp *CRUDSPlace) AuthGet(
	user schemas.UserRead, query types_.SearchQuery,
) types_.SearchQuery {
	// User can only access places they created
	if query.Where == nil {
		query.Where = make(types_.WhereFilters)
	}
	query.Where["creatorId"] = types_.EqFilters(user.ID)
	return query
}

func (cp *CRUDSPlace) Read(id int) (*orm.Place, error) {
	return gorm_.Read(cp, id)
}

func (cp *CRUDSPlace) Get(
	id int, options *PlaceOptions,
) (schemas.PlaceRead, error) {
	var zero schemas.PlaceRead

	if options == nil {
		options = &PlaceOptions{}
	}

	result, err := gorm_.Get(cp, id, nil)
	if err != nil {
		return zero, err
	}

	if options.Process {
		err = cp.PostProcess(&result)
		if err != nil {
			return zero, err
		}
	}

	return result, nil
}

func (cp *CRUDSPlace) UserGet(
	user *schemas.UserRead, id int, options *PlaceOptions,
) (schemas.PlaceRead, error) {
	var zero schemas.PlaceRead

	if options == nil {
		options = &PlaceOptions{}
	}

	result, err := gorm_.Get(cp, id, user)
	if err != nil {
		return zero, err
	}

	if options.Process {
		err = cp.PostProcess(&result)
		if err != nil {
			return zero, err
		}
	}

	return result, nil
}

func (cp *CRUDSPlace) GetPartial(
	id int, options *PlaceOptions,
) (map[string]any, error) {
	if options == nil {
		options = &PlaceOptions{}
	}

	fields := options.Fields
	if len(fields) == 0 {
		fields = cp.DefaultSelect()
	}

	result, err := gorm_.GetPartial(cp, id, fields, nil)
	if err != nil {
		return nil, err
	}

	if options.Process {
		err = cp.PostProcessPartial(result)
		if err != nil {
			return nil, err
		}
	}

	return result, nil
}

func (cp *CRUDSPlace) UserGetPartial(
	user *schemas.UserRead, id int, options *PlaceOptions,
) (map[string]any, error) {
	if options == nil {
		options = &PlaceOptions{}
	}

	fields := options.Fields
	if len(fields) == 0 {
		fields = cp.DefaultSelect()
	}

	result, err := gorm_.GetPartial(cp, id, fields, user)
	if err != nil {
		return nil, err
	}

	if options.Process {
		err = cp.PostProcessPartial(result)
		if err != nil {
			return nil, err
		}
	}

	return result, nil
}
