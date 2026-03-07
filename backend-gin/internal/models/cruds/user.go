package cruds

import (
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
	"strings"

	"gorm.io/gorm"
)

type UserOptions struct {
	Fields  []string
	Process bool
}

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
			string(schemas.UserSelectImageURL),
			string(schemas.UserSelectPlaces),
			string(schemas.UserSelectCreatedAt),
		},
		defaultOrderBy: []string{
			string(schemas.UserSortCreatedAtDesc),
		},
	}
}

func (cu *CRUDSUser) GetDB() *gorm.DB {
	return cu.DB
}

func (cu *CRUDSUser) GetModel() *gorm.DB {
	return cu.Model
}

func (cu *CRUDSUser) TableName() string {
	return string(orm.TableUsers)
}

func (cu *CRUDSUser) ModelName() string {
	return string(orm.ModelUser)
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
		ImageURL:  dbModel.ImageURL,
		Places:    places,
		CreatedAt: dbModel.CreatedAt,
	}
}

func (cu *CRUDSUser) PostProcess(read *schemas.UserRead) error {
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

func (cu *CRUDSUser) PostProcessPartial(partial map[string]any) error {
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

// Create

func (cu *CRUDSUser) ToModel(data schemas.UserCreate) orm.User {
	return orm.User{
		Name:     data.Name,
		Email:    data.Email,
		Password: data.Password,
		ImageURL: data.ImageURL,
		IsAdmin:  data.IsAdmin,
	}
}

func (cu *CRUDSUser) PostToCreate(
	data schemas.UserPost,
) (schemas.UserCreate, error) {
	var zero schemas.UserCreate
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
	return schemas.UserCreate{
		Name:     data.Name,
		Email:    data.Email,
		IsAdmin:  bool(data.IsAdmin),
		Password: data.Password,
		ImageURL: imageURL,
	}, nil
}

func (cu *CRUDSUser) BeforeCreate(tx *gorm.DB, data schemas.UserCreate) error {
	return nil
}

func (cu *CRUDSUser) AfterCreate(tx *gorm.DB, id uint, data schemas.UserCreate) error {
	return nil
}

func (cu *CRUDSUser) AuthPost(
	user schemas.UserRead, data schemas.UserPost,
) error {
	if user.IsAdmin {
		return nil
	}
	return types_.APIError{
		Code:    http.StatusUnauthorized,
		Message: "Not Authenticated",
		Details: map[string]any{"message": "Only admins can delete users"},
	}
}

func (cu *CRUDSUser) Create(data schemas.UserCreate) (uint, error) {
	hashed, err := utils.HashInput(data.Password, config.Env.DefaultHashSalt)
	if err != nil {
		return 0, err
	}
	data.Password = hashed
	return gorm_.CreateRecord(cu, data)
}

func (cu *CRUDSUser) Post(
	form schemas.UserPost, options *UserOptions,
) (schemas.UserRead, error) {
	var zero schemas.UserRead
	createdId, err := gorm_.PostRecord(cu, form, nil)
	if err != nil {
		return zero, err
	}
	return cu.Get(createdId, options)
}

func (cu *CRUDSUser) UserPost(
	user schemas.UserRead, form schemas.UserPost, options *UserOptions,
) (schemas.UserRead, error) {
	var zero schemas.UserRead
	createdId, err := gorm_.PostRecord(cu, form, &user)
	if err != nil {
		return zero, err
	}
	return cu.Get(createdId, options)
}

// Read

func (cu *CRUDSUser) AuthGet(
	user schemas.UserRead, query types_.SearchQuery,
) types_.SearchQuery {
	// User can only access their own profile in secure mode
	if query.Where == nil {
		query.Where = make(types_.WhereFilters)
	}
	query.Where["id"] = types_.EqFilters(user.ID)
	return query
}

func (cu *CRUDSUser) Read(id uint) (*orm.User, error) {
	return gorm_.Read(cu, id)
}

func (cu *CRUDSUser) Get(
	id uint, options *UserOptions,
) (schemas.UserRead, error) {
	var zero schemas.UserRead

	if options == nil {
		options = &UserOptions{}
	}

	result, err := gorm_.Get(cu, id, nil)
	if err != nil {
		return zero, err
	}

	if options.Process {
		err = cu.PostProcess(&result)
		if err != nil {
			return zero, err
		}
	}

	return result, nil
}

func (cu *CRUDSUser) UserGet(
	user *schemas.UserRead, id uint, options *UserOptions,
) (schemas.UserRead, error) {
	var zero schemas.UserRead

	if options == nil {
		options = &UserOptions{}
	}

	result, err := gorm_.Get(cu, id, user)
	if err != nil {
		return zero, err
	}

	if options.Process {
		err = cu.PostProcess(&result)
		if err != nil {
			return zero, err
		}
	}

	return result, nil
}

func (cu *CRUDSUser) GetPartial(
	id uint, options *UserOptions,
) (map[string]any, error) {
	if options == nil {
		options = &UserOptions{}
	}

	fields := options.Fields
	if len(fields) == 0 {
		fields = cu.DefaultSelect()
	}

	result, err := gorm_.GetPartial(cu, id, fields, nil)
	if err != nil {
		return nil, err
	}

	if options.Process {
		err = cu.PostProcessPartial(result)
		if err != nil {
			return nil, err
		}
	}

	return result, nil
}

func (cu *CRUDSUser) UserGetPartial(
	user *schemas.UserRead, id uint, options *UserOptions,
) (map[string]any, error) {
	if options == nil {
		options = &UserOptions{}
	}

	fields := options.Fields
	if len(fields) == 0 {
		fields = cu.DefaultSelect()
	}

	result, err := gorm_.GetPartial(cu, id, fields, user)
	if err != nil {
		return nil, err
	}

	if options.Process {
		err = cu.PostProcessPartial(result)
		if err != nil {
			return nil, err
		}
	}

	return result, nil
}

func (cu *CRUDSUser) CheckDuplicate(email string, name string) (string, error) {
	var messages []string

	emailExists, err := gorm_.Exists(cu, types_.WhereFilters{
		"email": types_.EqFilters(email),
	})
	if err != nil {
		return "", err
	}
	if emailExists {
		messages = append(messages, fmt.Sprintf("email %s already in use.", email))
	}

	nameExists, err := gorm_.Exists(cu, types_.WhereFilters{
		"name": types_.EqFilters(name),
	})
	if err != nil {
		return "", err
	}
	if nameExists {
		messages = append(messages, fmt.Sprintf("username %s already in use.", name))
	}

	return strings.Join(messages, " "), nil
}

func (cu *CRUDSUser) GetByEmail(email string) (schemas.UserRead, error) {
	var zero schemas.UserRead

	query := types_.SearchQuery{
		Select: cu.DefaultSelect(),
		Where: types_.WhereFilters{
			"email": types_.EqFilters(email),
		},
	}

	qb, err := gorm_.BuildSelectQuery(cu, query)
	if err != nil {
		return zero, err
	}

	var model orm.User
	err = qb.First(&model).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			err := types_.APIError{
				Code:    http.StatusNotFound,
				Message: fmt.Sprintf("User with email %s not found", email),
			}
			return zero, err
		}
		return zero, err
	}

	return cu.ToRead(&model), nil
}

// Update

func (cu *CRUDSUser) PutToUpdate(form schemas.UserPut) (schemas.UserUpdate, error) {
	return schemas.UserUpdate{
		Name:     form.Name,
		Email:    form.Email,
		Password: form.Password,
	}, nil
}

func (cu *CRUDSUser) AuthPut(
	user schemas.UserRead, id uint, data schemas.UserPut,
) error {
	if user.IsAdmin {
		return nil
	}

	if user.ID != id {
		return types_.APIError{
			Code:    http.StatusUnauthorized,
			Message: fmt.Sprintf("Access to user with id %d not granted", id),
		}
	}
	return nil
}

func (cu *CRUDSUser) BeforeUpdate(
	query *gorm.DB, id uint, data schemas.UserUpdate,
) error {
	return nil
}

func (cu *CRUDSUser) AfterUpdate(
	query *gorm.DB, id uint, data schemas.UserUpdate,
) error {
	return nil
}

func (cu *CRUDSUser) Update(id uint, data schemas.UserUpdate) error {
	return gorm_.UpdateRecord(cu, id, data)
}

func (cu *CRUDSUser) Put(
	id uint, form schemas.UserPut, options *UserOptions,
) (schemas.UserRead, error) {
	var zero schemas.UserRead

	err := gorm_.PutRecord(cu, id, form, nil)
	if err != nil {
		return zero, err
	}
	return cu.Get(id, options)
}

func (cu *CRUDSUser) UserPut(
	user schemas.UserRead, id uint, form schemas.UserPut, options *UserOptions,
) (schemas.UserRead, error) {
	var zero schemas.UserRead

	err := gorm_.PutRecord(cu, id, form, &user)
	if err != nil {
		return zero, err
	}
	return cu.Get(id, options)
}

// Delete

func (cu *CRUDSUser) AuthDelete(user schemas.UserRead, id uint) error {
	if user.IsAdmin {
		return nil
	}
	return types_.APIError{
		Code:    http.StatusUnauthorized,
		Message: "Not Authenticated",
		Details: map[string]any{"message": "Only admins can delete users"},
	}
}

func (cu *CRUDSUser) BeforeDelete(query *gorm.DB, model orm.User) error {
	return nil
}

func (cu *CRUDSUser) AfterDelete(query *gorm.DB, model orm.User) error {
	if model.ImageURL != "" {
		ctx := context.Background()
		storage := instances.GetStorage()
		_, err := storage.DeleteFile(ctx, model.ImageURL)
		if err != nil {
			return types_.APIError{
				Code:    http.StatusConflict,
				Message: "could not delete user stored image",
				Details: map[string]any{"id": model.ID, "email": model.Email},
			}
		}
	}
	return nil
}

func (cu *CRUDSUser) Delete(id uint) error {
	return gorm_.DeleteRecord(cu, id, nil)
}

func (cu *CRUDSUser) UserDelete(user schemas.UserRead, id uint) error {
	return gorm_.DeleteRecord(cu, id, &user)
}
