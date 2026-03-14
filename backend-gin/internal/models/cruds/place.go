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
	"sync"

	"github.com/pgvector/pgvector-go"
	"gorm.io/gorm"
)

const MaxPlaceConcurentProcessing = 50

type PlaceOptions struct {
	Fields  []string
	Process bool
}

type PlaceCreateContex struct{}

type PlaceUpdateContext struct {
	TriggerEmbedding bool
}

type PlaceDeleteContext struct {
	ImageURL string
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
		Model:           db.Model(&orm.Place{}),
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

var GetCRUDSPlace = sync.OnceValue(func() *CRUDSPlace {
	return NewCRUDSPlace()
})

func (cp *CRUDSPlace) GetDB(ctx context.Context) *gorm.DB {
	return cp.DB.WithContext(ctx)
}

func (cp *CRUDSPlace) GetModel(ctx context.Context) *gorm.DB {
	return cp.Model.WithContext(ctx)
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

func (cp *CRUDSPlace) ToJSON(
	model orm.Place, fields []string,
) (map[string]any, error) {
	result := make(map[string]any)
	for _, field := range fields {
		switch field {
		case string(schemas.PlaceSelectId):
			result["id"] = model.ID
		case string(schemas.PlaceSelectTitle):
			result["title"] = model.Title
		case string(schemas.PlaceSelectDescription):
			result["description"] = model.Description
		case string(schemas.PlaceSelectAddress):
			result["address"] = model.Address
		case string(schemas.PlaceSelectLocation):
			result["location"] = model.Location
		case string(schemas.PlaceSelectImageURL):
			result["imageUrl"] = model.ImageURL
		case string(schemas.PlaceSelectCreatorId):
			result["creatorId"] = model.CreatorID
		case string(schemas.PlaceSelectCreatedAt):
			result["createdAt"] = model.CreatedAt
		default:
			return result, fmt.Errorf("unknow field %s in place schema", field)
		}
	}
	return result, nil
}

func (cp *CRUDSPlace) PostProcess(
	ctx context.Context, read *schemas.PlaceRead,
) error {
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

func (cp *CRUDSPlace) PostProcessPartial(
	ctx context.Context, partial map[string]any,
) error {
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
	return []gorm_.SelectField{{Field: utils.CamelToSnake(field)}}
}

func (cp *CRUDSPlace) MapOrderBy(field string) string {
	return utils.CamelToSnake(field)
}

func (cp *CRUDSPlace) MapWhere(field string) string {
	switch field {
	case string(schemas.PlaceSearchLocationLat):
		return "(location->>'lat')::float"
	case string(schemas.PlaceSearchLocationLng):
		return "(location->>'lng')::float"
	default:
		return utils.CamelToSnake(field)
	}
}

func (cp *CRUDSPlace) BuildQuery(
	ctx context.Context, query types_.SearchQuery,
) (*gorm.DB, error) {
	return gorm_.BuildSelectQuery(ctx, cp, query)
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
	ctx context.Context, data schemas.PlacePost,
) (schemas.PlaceCreate, error) {
	var zero schemas.PlaceCreate
	var err error
	imageURL := ""
	if data.Image != nil {
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

func (cp *CRUDSPlace) BeforeCreate(
	tx *gorm.DB, data schemas.PlaceCreate,
) (PlaceCreateContex, error) {
	return PlaceCreateContex{}, nil
}

func (cp *CRUDSPlace) AfterCreate(
	tx *gorm.DB, id uint, data schemas.PlaceCreate, hooksData PlaceCreateContex,
) error {
	_, err := publishers.PlaceEmbedding(id)
	return err
}

func (cp *CRUDSPlace) AuthPost(
	ctx context.Context,
	user schemas.UserRead,
	data schemas.PlacePost,
) error {
	if user.IsAdmin {
		exists, err := UserExists(cp.GetDB(ctx), int(data.CreatorID))
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

func (cp *CRUDSPlace) Create(
	ctx context.Context, data schemas.PlaceCreate,
) (uint, error) {
	return gorm_.CreateRecord(ctx, cp, data)
}

func (cp *CRUDSPlace) Seed(
	ctx context.Context, data schemas.PlaceCreate, embedding []float32,
) (uint, error) {
	id, err := gorm_.CreateRecord(ctx, cp, data)
	if err != nil {
		return 0, err
	}
	return id, cp.UpdateEmbedding(ctx, id, embedding)
}

func (cp *CRUDSPlace) Post(
	ctx context.Context, form schemas.PlacePost, options *PlaceOptions,
) (schemas.PlaceRead, error) {
	var zero schemas.PlaceRead
	createdId, err := gorm_.PostRecord(ctx, cp, form, nil)
	if err != nil {
		return zero, err
	}
	return cp.Get(ctx, createdId, options)
}

func (cp *CRUDSPlace) UserPost(
	ctx context.Context,
	user schemas.UserRead,
	form schemas.PlacePost,
	options *PlaceOptions,
) (schemas.PlaceRead, error) {
	var zero schemas.PlaceRead
	createdId, err := gorm_.PostRecord(ctx, cp, form, &user)
	if err != nil {
		return zero, err
	}
	return cp.Get(ctx, createdId, options)
}

// Read

func (cp *CRUDSPlace) AuthGet(
	ctx context.Context, user schemas.UserRead, query types_.SearchQuery,
) types_.SearchQuery {
	// User can only access places they created
	if query.Where == nil {
		query.Where = make(types_.WhereFilters)
	}
	query.Where["creatorId"] = types_.EqFilters(user.ID)
	return query
}

func (cp *CRUDSPlace) Read(ctx context.Context, id uint) (*orm.Place, error) {
	return gorm_.Read(ctx, cp, id)
}

func (cp *CRUDSPlace) Get(
	ctx context.Context, id uint, options *PlaceOptions,
) (schemas.PlaceRead, error) {
	var zero schemas.PlaceRead

	if options == nil {
		options = &PlaceOptions{}
	}

	result, err := gorm_.Get(ctx, cp, id, nil)
	if err != nil {
		return zero, err
	}

	if options.Process {
		err = cp.PostProcess(ctx, &result)
		if err != nil {
			return zero, err
		}
	}

	return result, nil
}

func (cp *CRUDSPlace) UserGet(
	ctx context.Context, user *schemas.UserRead, id uint, options *PlaceOptions,
) (schemas.PlaceRead, error) {
	var zero schemas.PlaceRead

	if options == nil {
		options = &PlaceOptions{}
	}

	result, err := gorm_.Get(ctx, cp, id, user)
	if err != nil {
		return zero, err
	}

	if options.Process {
		err = cp.PostProcess(ctx, &result)
		if err != nil {
			return zero, err
		}
	}

	return result, nil
}

func (cp *CRUDSPlace) GetPartial(
	ctx context.Context, id uint, options *PlaceOptions,
) (map[string]any, error) {
	if options == nil {
		options = &PlaceOptions{}
	}

	fields := options.Fields
	if len(fields) == 0 {
		fields = cp.DefaultSelect()
	}

	result, err := gorm_.GetPartial(ctx, cp, id, fields, nil)
	if err != nil {
		return nil, err
	}

	if options.Process {
		err = cp.PostProcessPartial(ctx, result)
		if err != nil {
			return nil, err
		}
	}

	return result, nil
}

func (cp *CRUDSPlace) UserGetPartial(
	ctx context.Context, user *schemas.UserRead, id uint, options *PlaceOptions,
) (map[string]any, error) {
	if options == nil {
		options = &PlaceOptions{}
	}

	fields := options.Fields
	if len(fields) == 0 {
		fields = cp.DefaultSelect()
	}

	result, err := gorm_.GetPartial(ctx, cp, id, fields, user)
	if err != nil {
		return nil, err
	}

	if options.Process {
		err = cp.PostProcessPartial(ctx, result)
		if err != nil {
			return nil, err
		}
	}

	return result, nil
}

// Update

func (cp *CRUDSPlace) PutToUpdate(
	ctx context.Context, form schemas.PlacePut,
) (schemas.PlaceUpdate, error) {
	updates := schemas.PlaceUpdate{}

	if form.Title != nil {
		updates["title"] = *form.Title
	}
	if form.Description != nil {
		updates["description"] = *form.Description
	}
	if form.Address != nil {
		updates["address"] = *form.Address
	}
	if form.Location != nil {
		updates["location"] = schemas.Location{
			Lat: float64(form.Location.Lat),
			Lng: float64(form.Location.Lng),
		}
	}

	return updates, nil
}

func (cp *CRUDSPlace) AuthPut(
	ctx context.Context, user schemas.UserRead, id uint, data schemas.PlacePut,
) error {
	if user.IsAdmin {
		return nil
	}

	exists, err := gorm_.Exists(ctx, cp, types_.WhereFilters{
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
) (PlaceUpdateContext, error) {
	var place orm.Place
	err := query.
		Model(&place).Select("title", "description").Where("id = ?", id).First(&place).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return PlaceUpdateContext{}, types_.NotFoundError(cp.ModelName(), id)
		}
		return PlaceUpdateContext{}, err
	}

	newTitle, titleSent := data["title"]
	titleChanged := newTitle != place.Title && titleSent
	newDescription, descriptionSent := data["description"]
	descriptionChanged := newDescription != place.Description && descriptionSent

	return PlaceUpdateContext{TriggerEmbedding: titleChanged || descriptionChanged}, nil
}

func (cp *CRUDSPlace) AfterUpdate(
	query *gorm.DB, id uint, data schemas.PlaceUpdate, hooksData PlaceUpdateContext,
) error {
	if hooksData.TriggerEmbedding {
		_, err := publishers.PlaceEmbedding(id)
		return err
	}
	return nil
}

func (cp *CRUDSPlace) Update(
	ctx context.Context, id uint, data schemas.PlaceUpdate,
) error {
	return gorm_.UpdateRecord(ctx, cp, id, data)
}

func (cp *CRUDSPlace) Put(
	ctx context.Context, id uint, form schemas.PlacePut, options *PlaceOptions,
) (schemas.PlaceRead, error) {
	var zero schemas.PlaceRead

	err := gorm_.PutRecord(ctx, cp, id, form, nil)
	if err != nil {
		return zero, err
	}
	return cp.Get(ctx, id, options)
}

func (cp *CRUDSPlace) UserPut(
	ctx context.Context,
	user schemas.UserRead,
	id uint,
	form schemas.PlacePut,
	options *PlaceOptions,
) (schemas.PlaceRead, error) {
	var zero schemas.PlaceRead

	err := gorm_.PutRecord(ctx, cp, id, form, &user)
	if err != nil {
		return zero, err
	}
	return cp.Get(ctx, id, options)
}

func (cp *CRUDSPlace) UpdateEmbedding(
	ctx context.Context, id uint, vector []float32) error {
	pgVector := pgvector.NewVector(vector)
	return cp.GetModel(ctx).Where("id = ?", id).
		Update("embedding", pgVector).
		Error
}

func (cp *CRUDSPlace) Embed(ctx context.Context, id uint) ([]float32, error) {
	// Fetch title and description
	var place orm.Place
	err := cp.GetModel(ctx).Select("title", "description").First(&place, id).Error
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
	if err := cp.UpdateEmbedding(ctx, id, vector); err != nil {
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

func (cp *CRUDSPlace) AuthDelete(
	ctx context.Context, user schemas.UserRead, id uint,
) error {
	if user.IsAdmin {
		return nil
	}

	exists, err := gorm_.Exists(ctx, cp, types_.WhereFilters{
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

func (cp *CRUDSPlace) BeforeDelete(query *gorm.DB, id uint) (PlaceDeleteContext, error) {
	var place orm.Place
	err := query.Model(&place).Select("image_url").Where("id = ?", id).First(&place).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return PlaceDeleteContext{}, types_.NotFoundError(cp.ModelName(), id)
		}
		return PlaceDeleteContext{}, err
	}
	return PlaceDeleteContext{ImageURL: place.ImageURL}, nil
}

func (cp *CRUDSPlace) AfterDelete(
	query *gorm.DB, id uint, hooksData PlaceDeleteContext,
) error {
	if hooksData.ImageURL != "" {
		ctx := query.Statement.Context
		storage := instances.GetStorage()
		_, err := storage.DeleteFile(ctx, hooksData.ImageURL)
		if err != nil {
			message := fmt.Sprintf("something went wrong after trying to delete place %d", id)
			return types_.APIError{
				Code:    http.StatusConflict,
				Message: message,
			}
		}
	}
	return nil
}

func (cp *CRUDSPlace) Delete(ctx context.Context, id uint) error {
	return gorm_.DeleteRecord(ctx, cp, id, nil)
}

func (cp *CRUDSPlace) UserDelete(
	ctx context.Context, user schemas.UserRead, id uint,
) error {
	return gorm_.DeleteRecord(ctx, cp, id, &user)
}

// Search

func (cp *CRUDSPlace) Search(
	ctx context.Context, query types_.SearchQuery,
) ([]schemas.PlaceRead, error) {
	return gorm_.GetMany(ctx, cp, query, nil)
}

func (cp *CRUDSPlace) UserSearch(
	ctx context.Context, user schemas.UserRead, query types_.SearchQuery,
) ([]schemas.PlaceRead, error) {
	return gorm_.GetMany(ctx, cp, query, &user)
}

func (cp *CRUDSPlace) SearchPartial(
	ctx context.Context, query types_.SearchQuery,
) ([]map[string]any, error) {
	return gorm_.GetManyPartial(ctx, cp, query, nil)
}

func (cp *CRUDSPlace) UserSearchPartial(
	ctx context.Context, user schemas.UserRead, query types_.SearchQuery,
) ([]map[string]any, error) {
	return gorm_.GetManyPartial(ctx, cp, query, &user)
}

func (cp *CRUDSPlace) Paginate(
	ctx context.Context, query types_.SearchQuery, options *PlaceOptions,
) (types_.PaginatedDict, error) {
	process := false
	if options != nil {
		process = options.Process
	}
	return gorm_.Paginate(ctx, cp, query, nil, process, MaxPlaceConcurentProcessing)
}

func (cp *CRUDSPlace) UserPaginate(
	ctx context.Context,
	user schemas.UserRead,
	query types_.SearchQuery,
	options *PlaceOptions,
) (types_.PaginatedDict, error) {
	process := false
	if options != nil {
		process = options.Process
	}
	return gorm_.Paginate(ctx, cp, query, &user, process, MaxPlaceConcurentProcessing)
}
