package cruds

import (
	"backend/internal/background/publishers"
	"backend/internal/config"
	"backend/internal/lib/gorm_"
	"backend/internal/lib/types_"
	"backend/internal/lib/utils"
	"backend/internal/models/orm"
	"backend/internal/models/schemas"
	"backend/internal/services/instances"
	"context"
	"fmt"
	"net/http"

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

func (cp *CRUDSPlace) GetDB() *gorm.DB {
	return cp.DB
}

func (cp *CRUDSPlace) GetModel() *gorm.DB {
	return cp.Model
}

func (cp *CRUDSPlace) TableName() string {
	return string(orm.TablePlaces)
}

func (cp *CRUDSPlace) ModelName() string {
	return string(orm.ModelPlace)
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

// Create

func (cp *CRUDSPlace) ToModel(data schemas.PlaceCreate) orm.Place {
	return orm.Place{
		Title:       data.Title,
		Description: data.Description,
		Address:     data.Address,
		ImageURL:    data.ImageURL,
		Location:    orm.Location(data.Location),
		Embedding:   nil,
		CreatorID:   data.CreatorID,
	}
}

func (cp *CRUDSPlace) PostToCreate(
	data schemas.PlacePost,
) (schemas.PlaceCreate, error) {
	var zero schemas.PlaceCreate
	var err error
	imageURL := ""
	if data.Image != nil {
		ctx := context.Background()
		storage := instances.GetStorage()
		imageURL, err = storage.UploadFile(ctx, data.Image, "")
		if err != nil {
			return zero, err
		}
	}

	location := schemas.Location{Lat: float64(data.Lat), Lng: float64(data.Lng)}
	return schemas.PlaceCreate{
		Title:       data.Title,
		Description: data.Description,
		Address:     data.Address,
		Location:    location,
		Embedding:   nil,
		ImageURL:    imageURL,
		CreatorID:   data.CreatorID,
	}, nil
}

func (cp *CRUDSPlace) BeforeCreate(tx *gorm.DB, data schemas.PlaceCreate) error {
	return nil
}

func (cp *CRUDSPlace) AfterCreate(tx *gorm.DB, id uint, data schemas.PlaceCreate) error {
	_, err := publishers.PlaceEmbedding(id)
	return err
}

func (cp *CRUDSPlace) AuthPost(
	user schemas.UserRead, data schemas.PlacePost,
) error {
	if user.IsAdmin {
		exists, err := UserExists(cp.DB, int(data.CreatorID))
		if err != nil {
			return err
		}
		if !exists {
			message := fmt.Sprintf("Cannot set creatorId to %d, No user with id %d found in the database", data.CreatorID, data.CreatorID)
			return types_.APIError{
				Code:    http.StatusNotFound,
				Message: "User not found",
				Details: map[string]any{"message": message},
			}
		}
		return nil
	}

	if user.ID != data.CreatorID {
		message := fmt.Sprintf("Cannot add places to user %d", data.CreatorID)
		return types_.APIError{
			Code:    http.StatusUnauthorized,
			Message: "Access denied",
			Details: map[string]any{"message": message},
		}
	}
	return nil
}

func (cp *CRUDSPlace) Create(data schemas.PlaceCreate) (uint, error) {
	return gorm_.CreateRecord(cp, data)
}

func (cp *CRUDSPlace) Post(
	form schemas.PlacePost, options *PlaceOptions,
) (schemas.PlaceRead, error) {
	var zero schemas.PlaceRead
	createdId, err := gorm_.PostRecord(cp, form, nil)
	if err != nil {
		return zero, err
	}
	return cp.Get(createdId, options)
}

func (cp *CRUDSPlace) UserPost(
	user schemas.UserRead, form schemas.PlacePost, options *PlaceOptions,
) (schemas.PlaceRead, error) {
	var zero schemas.PlaceRead
	createdId, err := gorm_.PostRecord(cp, form, &user)
	if err != nil {
		return zero, err
	}
	return cp.Get(createdId, options)
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

func (cp *CRUDSPlace) Read(id uint) (*orm.Place, error) {
	return gorm_.Read(cp, id)
}

func (cp *CRUDSPlace) Get(
	id uint, options *PlaceOptions,
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
	user *schemas.UserRead, id uint, options *PlaceOptions,
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
	id uint, options *PlaceOptions,
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
	user *schemas.UserRead, id uint, options *PlaceOptions,
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

// Update

func (cp *CRUDSPlace) PutToUpdate(form schemas.PlacePut) (schemas.PlaceUpdate, error) {
	location := schemas.Location{
		Lat: float64(form.Location.Lat), Lng: float64(form.Location.Lng),
	}
	return schemas.PlaceUpdate{
		Title:       form.Title,
		Description: form.Description,
		Address:     form.Address,
		Location:    &location,
	}, nil
}

func (cp *CRUDSPlace) AuthPut(
	user schemas.UserRead, id uint, data schemas.PlaceUpdate,
) error {
	if user.IsAdmin {
		return nil
	}

	exists, err := gorm_.Exists(cp, types_.WhereFilters{
		"id": types_.EqFilters(id), "creatorId": types_.EqFilters(user.ID),
	})
	if err != nil {
		return err
	}
	if !exists {
		message := fmt.Sprintf("Cannot access place %d", id)
		return types_.APIError{
			Code:    http.StatusUnauthorized,
			Message: "Access denied",
			Details: map[string]any{"message": message},
		}
	}
	return nil
}

func (cp *CRUDSPlace) BeforeUpdate(
	query *gorm.DB, id uint, data schemas.PlaceUpdate,
) error {
	return nil
}

func (cp *CRUDSPlace) AfterUpdate(
	query *gorm.DB, id uint, data schemas.PlaceUpdate,
) error {
	return nil
}
