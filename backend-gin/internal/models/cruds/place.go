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
	"errors"
	"fmt"
	"net/http"

	"github.com/pgvector/pgvector-go"
	"gorm.io/gorm"
)

const MaxPlaceConcurentProcessing = 50

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

func (cp *CRUDSPlace) Seed(data schemas.PlaceCreate, embedding []float32) (uint, error) {
	id, err := gorm_.CreateRecord(cp, data)
	if err != nil {
		return 0, err
	}
	return id, cp.UpdateEmbedding(id, embedding)
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
	user schemas.UserRead, id uint, data schemas.PlacePut,
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

func (cp *CRUDSPlace) Update(id uint, data schemas.PlaceUpdate) error {
	return gorm_.UpdateRecord(cp, id, data)
}

func (cp *CRUDSPlace) Put(
	id uint, form schemas.PlacePut, options *PlaceOptions,
) (schemas.PlaceRead, error) {
	var zero schemas.PlaceRead

	err := gorm_.PutRecord(cp, id, form, nil)
	if err != nil {
		return zero, err
	}
	return cp.Get(id, options)
}

func (cp *CRUDSPlace) UserPut(
	user schemas.UserRead, id uint, form schemas.PlacePut, options *PlaceOptions,
) (schemas.PlaceRead, error) {
	var zero schemas.PlaceRead

	err := gorm_.PutRecord(cp, id, form, &user)
	if err != nil {
		return zero, err
	}
	return cp.Get(id, options)
}

func (cp *CRUDSPlace) UpdateEmbedding(id uint, vector []float32) error {
	pgVector := pgvector.NewVector(vector)
	return cp.Model.Where("id = ?", id).
		Update("embedding", pgVector).
		Error
}

func (cp *CRUDSPlace) Embed(ctx context.Context, id uint) ([]float32, error) {
	// Fetch title and description
	var place orm.Place
	err := cp.Model.Select("title", "description").First(&place, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, types_.APIError{
				Code:    http.StatusNotFound,
				Message: fmt.Sprintf("No place with id %d found in the database", id),
			}
		}
		return nil, err
	}

	// Create text for embedding
	text := fmt.Sprintf("%s - %s", place.Title, place.Description)

	// Get embedding from service
	hf := instances.GetHfClient()
	vector, err := hf.EmbedText(ctx, text)
	if err != nil {
		return nil, types_.APIError{
			Code:    http.StatusConflict,
			Message: "embedding failed",
			Details: map[string]any{
				"placeId": id,
				"message": err.Error(),
			},
			Err: err,
		}
	}

	// Update embedding in database
	if err := cp.UpdateEmbedding(id, vector); err != nil {
		return nil, types_.APIError{
			Code:    http.StatusInternalServerError,
			Message: "embedding failed",
			Details: map[string]any{
				"placeId": id,
				"message": err.Error(),
			},
		}
	}

	return vector, nil
}

// Delete

func (cp *CRUDSPlace) AuthDelete(user schemas.UserRead, id uint) error {
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

func (cp *CRUDSPlace) BeforeDelete(query *gorm.DB, model orm.Place) error {
	return nil
}

func (cp *CRUDSPlace) AfterDelete(query *gorm.DB, model orm.Place) error {
	if model.ImageURL != "" {
		ctx := context.Background()
		storage := instances.GetStorage()
		_, err := storage.DeleteFile(ctx, model.ImageURL)
		if err != nil {
			return types_.APIError{
				Code:    http.StatusConflict,
				Message: "could not delete place stored image",
				Details: map[string]any{"id": model.ID, "title": model.Title},
			}
		}
	}
	return nil
}

func (cp *CRUDSPlace) Delete(id uint) error {
	return gorm_.DeleteRecord(cp, id, nil)
}

func (cp *CRUDSPlace) UserDelete(user schemas.UserRead, id uint) error {
	return gorm_.DeleteRecord(cp, id, &user)
}

// Search

func (cp *CRUDSPlace) Search(query types_.SearchQuery) ([]schemas.PlaceRead, error) {
	return gorm_.GetMany(cp, query, nil)
}

func (cp *CRUDSPlace) UserSearch(
	user schemas.UserRead, query types_.SearchQuery,
) ([]schemas.PlaceRead, error) {
	return gorm_.GetMany(cp, query, &user)
}

func (cp *CRUDSPlace) SearchPartial(query types_.SearchQuery) ([]map[string]any, error) {
	return gorm_.GetManyPartial(cp, query, nil)
}

func (cp *CRUDSPlace) UserSearchPartial(
	user schemas.UserRead, query types_.SearchQuery,
) ([]map[string]any, error) {
	return gorm_.GetManyPartial(cp, query, &user)
}

func (cp *CRUDSPlace) Paginate(
	query types_.SearchQuery, options *PlaceOptions,
) (types_.PaginatedDict, error) {
	process := false
	if options != nil {
		process = options.Process
	}
	return gorm_.Paginate(cp, query, nil, process, MaxPlaceConcurentProcessing)
}

func (cp *CRUDSPlace) UserPaginate(
	user schemas.UserRead, query types_.SearchQuery, options *PlaceOptions,
) (types_.PaginatedDict, error) {
	process := false
	if options != nil {
		process = options.Process
	}
	return gorm_.Paginate(cp, query, &user, process, MaxPlaceConcurentProcessing)
}
