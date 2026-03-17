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
	"sync"

	"gorm.io/gorm"
)

const MaxUserConcurentProcessing = 50

type UserOptions struct {
	Fields  []string
	Process bool
}

type UserCreateContext struct{}

type UserUpdateContex struct{}

type UserDeleteContext struct {
	ImageURL string
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

var GetCRUDSUser = sync.OnceValue(func() *CRUDSUser {
	return NewCRUDSUser()
})

func (cu *CRUDSUser) GetDB(ctx context.Context) *gorm.DB {
	return cu.DB.WithContext(ctx)
}

func (cu *CRUDSUser) GetModel(ctx context.Context) *gorm.DB {
	return cu.Model.WithContext(ctx)
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

func (cu *CRUDSUser) ToJSON(
	model orm.User, fields []string,
) (map[string]any, error) {
	result := make(map[string]any)
	for _, field := range fields {
		switch field {
		case string(schemas.UserSelectId):
			result[string(schemas.UserSelectId)] = model.ID
		case string(schemas.UserSelectName):
			result[string(schemas.UserSelectName)] = model.Name
		case string(schemas.UserSelectEmail):
			result[string(schemas.UserSelectEmail)] = model.Email
		case string(schemas.UserSelectIsAdmin):
			result[string(schemas.UserSelectIsAdmin)] = model.IsAdmin
		case string(schemas.UserSelectImageURL):
			result[string(schemas.UserSelectImageURL)] = model.ImageURL
		case string(schemas.UserSelectPlaces):
			places := make([]map[string]any, len(model.Places))
			for i, place := range model.Places {
				places[i] = map[string]any{
					string(schemas.PlaceSelectId):      place.ID,
					string(schemas.PlaceSelectTitle):   place.Title,
					string(schemas.PlaceSelectAddress): place.Address,
				}
			}
			result[string(schemas.UserSelectPlaces)] = places
		case string(schemas.UserSelectCreatedAt):
			result[string(schemas.UserSelectCreatedAt)] = model.CreatedAt
		default:
			return result, fmt.Errorf("unknow field %s in user schema", field)
		}
	}
	return result, nil
}

func (cu *CRUDSUser) PostProcess(
	ctx context.Context, read *schemas.UserRead,
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

func (cu *CRUDSUser) PostProcessPartial(
	ctx context.Context, partial map[string]any,
) error {
	imageURL, exists := partial[string(schemas.UserSelectImageURL)]
	if !exists {
		return nil
	}

	storage := instances.GetStorage()
	signedURL, err := storage.GetSignedURL(imageURL.(string), config.Env.JWTExpiration)
	if err != nil {
		return err
	}

	partial[string(schemas.UserSelectImageURL)] = signedURL
	return nil
}

// Query Building

func (cu *CRUDSUser) MapSelect(field string) []gorm_.SelectField {
	switch field {
	case string(schemas.UserSelectPlaces):
		relation := string(orm.RelationPlace)
		return []gorm_.SelectField{
			{Field: string(schemas.UserSelectId)},
			{Field: string(schemas.PlaceSelectCreatorId), Preload: relation, Level: 1},
			{Field: string(schemas.PlaceSelectId), Preload: relation, Level: 1},
			{Field: string(schemas.PlaceSelectTitle), Preload: relation, Level: 1},
			{Field: string(schemas.PlaceSelectAddress), Preload: relation, Level: 1},
		}

	default:
		return []gorm_.SelectField{{Field: field}}
	}
}

func (cu *CRUDSUser) MapOrderBy(field string) string {
	return field
}

func (cu *CRUDSUser) MapWhere(field string) string {
	return field
}

func (cu *CRUDSUser) BuildQuery(
	ctx context.Context, query types_.SearchQuery,
) (*gorm.DB, error) {
	return gorm_.BuildSelectQuery(ctx, cu, query)
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
	ctx context.Context, data schemas.UserPost,
) (schemas.UserCreate, error) {
	var zero schemas.UserCreate

	// Hash password
	hashed, err := utils.HashInput(data.Password, config.Env.DefaultHashSalt)
	if err != nil {
		return zero, err
	}
	data.Password = hashed

	// Upload Image if found
	imageURL := ""
	if data.Image != nil {
		storage := instances.GetStorage()
		imageURL, err = storage.UploadFile(ctx, data.Image, "")
		if err != nil {
			return zero, fmt.Errorf("could not upload file: %w", err)
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

func (cu *CRUDSUser) BeforeCreate(
	tx *gorm.DB, data schemas.UserCreate,
) (UserCreateContext, error) {
	return UserCreateContext{}, nil
}

func (cu *CRUDSUser) AfterCreate(
	tx *gorm.DB, id uint, data schemas.UserCreate, hooksData UserCreateContext,
) error {
	return nil
}

func (cu *CRUDSUser) AuthPost(
	ctx context.Context, user schemas.UserRead, data schemas.UserPost,
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

func (cu *CRUDSUser) Create(
	ctx context.Context, data schemas.UserCreate,
) (uint, error) {
	return gorm_.CreateRecord(ctx, cu, data)
}

func (cu *CRUDSUser) Post(
	ctx context.Context, form schemas.UserPost, options *UserOptions,
) (schemas.UserRead, error) {
	var zero schemas.UserRead
	createdId, err := gorm_.PostRecord(ctx, cu, form, nil)
	if err != nil {
		return zero, err
	}
	return cu.Get(ctx, createdId, options)
}

func (cu *CRUDSUser) UserPost(
	ctx context.Context,
	user schemas.UserRead,
	form schemas.UserPost,
	options *UserOptions,
) (schemas.UserRead, error) {
	var zero schemas.UserRead
	createdId, err := gorm_.PostRecord(ctx, cu, form, &user)
	if err != nil {
		return zero, err
	}
	return cu.Get(ctx, createdId, options)
}

// Read

func (cu *CRUDSUser) AuthGet(
	ctx context.Context, user schemas.UserRead, query types_.SearchQuery,
) types_.SearchQuery {
	// User can only access their own profile in secure mode
	if query.Where == nil {
		query.Where = make(types_.WhereFilters)
	}
	query.Where[string(schemas.UserSearchId)] = types_.EqFilters(user.ID)
	return query
}

func (cu *CRUDSUser) Read(ctx context.Context, id uint) (*orm.User, error) {
	return gorm_.Read(ctx, cu, id)
}

func (cu *CRUDSUser) Get(
	ctx context.Context, id uint, options *UserOptions,
) (schemas.UserRead, error) {
	var zero schemas.UserRead

	if options == nil {
		options = &UserOptions{}
	}

	result, err := gorm_.Get(ctx, cu, id, nil)
	if err != nil {
		return zero, err
	}

	if options.Process {
		err = cu.PostProcess(ctx, &result)
		if err != nil {
			return zero, err
		}
	}

	return result, nil
}

func (cu *CRUDSUser) UserGet(
	ctx context.Context, user *schemas.UserRead, id uint, options *UserOptions,
) (schemas.UserRead, error) {
	var zero schemas.UserRead

	if options == nil {
		options = &UserOptions{}
	}

	result, err := gorm_.Get(ctx, cu, id, user)
	if err != nil {
		return zero, err
	}

	if options.Process {
		err = cu.PostProcess(ctx, &result)
		if err != nil {
			return zero, err
		}
	}

	return result, nil
}

func (cu *CRUDSUser) GetPartial(
	ctx context.Context, id uint, options *UserOptions,
) (map[string]any, error) {
	if options == nil {
		options = &UserOptions{}
	}

	fields := options.Fields
	if len(fields) == 0 {
		fields = cu.DefaultSelect()
	}

	result, err := gorm_.GetPartial(ctx, cu, id, fields, nil)
	if err != nil {
		return nil, err
	}

	if options.Process {
		err = cu.PostProcessPartial(ctx, result)
		if err != nil {
			return nil, err
		}
	}

	return result, nil
}

func (cu *CRUDSUser) UserGetPartial(
	ctx context.Context, user *schemas.UserRead, id uint, options *UserOptions,
) (map[string]any, error) {
	if options == nil {
		options = &UserOptions{}
	}

	fields := options.Fields
	if len(fields) == 0 {
		fields = cu.DefaultSelect()
	}

	result, err := gorm_.GetPartial(ctx, cu, id, fields, user)
	if err != nil {
		return nil, err
	}

	if options.Process {
		err = cu.PostProcessPartial(ctx, result)
		if err != nil {
			return nil, err
		}
	}

	return result, nil
}

func (cu *CRUDSUser) CheckDuplicate(
	ctx context.Context, email string, name string,
) (string, error) {
	var messages []string

	emailExists, err := gorm_.Exists(ctx, cu, types_.WhereFilters{
		"email": types_.EqFilters(email),
	})
	if err != nil {
		return "", err
	}
	if emailExists {
		messages = append(messages, fmt.Sprintf("email %s already in use.", email))
	}

	nameExists, err := gorm_.Exists(ctx, cu, types_.WhereFilters{
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

func (cu *CRUDSUser) GetByEmail(
	ctx context.Context, email string,
) (schemas.UserRead, error) {
	var zero schemas.UserRead

	query := types_.SearchQuery{
		Select: cu.DefaultSelect(),
		Where: types_.WhereFilters{
			"email": types_.EqFilters(email),
		},
	}

	qb, err := gorm_.BuildSelectQuery(ctx, cu, query)
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

func (cu *CRUDSUser) CacheKey(id uint) string {
	return fmt.Sprintf("user_read_%d", id)
}

func (cu *CRUDSUser) GetCache(ctx context.Context, id uint) (schemas.UserRead, error) {
	var result schemas.UserRead
	key := cu.CacheKey(id)
	redisClient := instances.GetRedisClient()
	err := redisClient.GetStruct(ctx, key, &result)
	if err == nil {
		return result, nil
	}

	// GetStruct delete data if it couldn't Unmarshall it

	// Fetch new data
	result, err = cu.Get(ctx, id, nil)
	if err != nil {
		return result, err
	}

	// Store new data before returning result
	_ = redisClient.Set(ctx, key, result)
	return result, nil
}

// Update

func (cu *CRUDSUser) PutToUpdate(
	ctx context.Context, form schemas.UserPut,
) (schemas.UserUpdate, error) {
	updates := schemas.UserUpdate{}
	if form.Name != nil {
		updates[string(schemas.UserSelectName)] = *form.Name
	}
	if form.Email != nil {
		updates[string(schemas.UserSelectEmail)] = *form.Email
	}
	if form.Password != nil {
		hashed, err := utils.HashInput(*form.Password, config.Env.DefaultHashSalt)
		if err != nil {
			return nil, err
		}
		updates["password"] = hashed
	}
	return updates, nil
}

func (cu *CRUDSUser) AuthPut(
	ctx context.Context, user schemas.UserRead, id uint, data schemas.UserPut,
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
) (UserUpdateContex, error) {
	return UserUpdateContex{}, nil
}

func (cu *CRUDSUser) AfterUpdate(
	query *gorm.DB, id uint, data schemas.UserUpdate, hooksData UserUpdateContex,
) error {
	ctx := query.Statement.Context
	key := cu.CacheKey(id)
	redisClient := instances.GetRedisClient()
	return redisClient.Delete(ctx, key)
}

func (cu *CRUDSUser) Update(
	ctx context.Context, id uint, data schemas.UserUpdate,
) error {
	return gorm_.UpdateRecord(ctx, cu, id, data)
}

func (cu *CRUDSUser) Put(
	ctx context.Context, id uint, form schemas.UserPut, options *UserOptions,
) (schemas.UserRead, error) {
	var zero schemas.UserRead

	err := gorm_.PutRecord(ctx, cu, id, form, nil)
	if err != nil {
		return zero, err
	}
	return cu.Get(ctx, id, options)
}

func (cu *CRUDSUser) UserPut(
	ctx context.Context,
	user schemas.UserRead,
	id uint,
	form schemas.UserPut,
	options *UserOptions,
) (schemas.UserRead, error) {
	var zero schemas.UserRead

	err := gorm_.PutRecord(ctx, cu, id, form, &user)
	if err != nil {
		return zero, err
	}
	return cu.Get(ctx, id, options)
}

// Delete

func (cu *CRUDSUser) AuthDelete(
	ctx context.Context, user schemas.UserRead, id uint,
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

func (cu *CRUDSUser) BeforeDelete(query *gorm.DB, id uint) (UserDeleteContext, error) {
	var user orm.User
	err := query.Model(&user).Select(string(schemas.UserSelectImageURL)).
		Where("id = ?", id).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return UserDeleteContext{}, types_.NotFoundError(cu.ModelName(), id)
		}
		return UserDeleteContext{}, err
	}
	return UserDeleteContext{ImageURL: user.ImageURL}, nil
}

func (cu *CRUDSUser) AfterDelete(
	query *gorm.DB, id uint, hooksData UserDeleteContext,
) error {
	// Delete user from redis cache
	ctx := query.Statement.Context
	key := cu.CacheKey(id)
	redisClient := instances.GetRedisClient()
	err := redisClient.Delete(ctx, key)
	if err != nil {
		return err
	}

	// Delete imageUrl
	if hooksData.ImageURL != "" {
		ctx := query.Statement.Context
		storage := instances.GetStorage()
		_, err := storage.DeleteFile(ctx, hooksData.ImageURL)
		if err != nil {
			message := fmt.Sprintf("something went wrong after trying to delete user %d", id)
			return types_.APIError{
				Code:    http.StatusConflict,
				Message: message,
			}
		}
	}
	return nil
}

func (cu *CRUDSUser) Delete(ctx context.Context, id uint) error {
	return gorm_.DeleteRecord(ctx, cu, id, nil)
}

func (cu *CRUDSUser) UserDelete(
	ctx context.Context, user schemas.UserRead, id uint,
) error {
	return gorm_.DeleteRecord(ctx, cu, id, &user)
}

// Search

func (cu *CRUDSUser) Search(
	ctx context.Context, query types_.SearchQuery,
) ([]schemas.UserRead, error) {
	return gorm_.GetMany(ctx, cu, query, nil)
}

func (cu *CRUDSUser) UserSearch(
	ctx context.Context, user schemas.UserRead, query types_.SearchQuery,
) ([]schemas.UserRead, error) {
	return gorm_.GetMany(ctx, cu, query, &user)
}

func (cu *CRUDSUser) SearchPartial(
	ctx context.Context, query types_.SearchQuery,
) ([]map[string]any, error) {
	return gorm_.GetManyPartial(ctx, cu, query, nil)
}

func (cu *CRUDSUser) UserSearchPartial(
	ctx context.Context, user schemas.UserRead, query types_.SearchQuery,
) ([]map[string]any, error) {
	return gorm_.GetManyPartial(ctx, cu, query, &user)
}

func (cu *CRUDSUser) Paginate(
	ctx context.Context, query types_.SearchQuery, options *UserOptions,
) (types_.PaginatedDict, error) {
	process := false
	if options != nil {
		process = options.Process
	}
	return gorm_.Paginate(ctx, cu, query, nil, process, MaxUserConcurentProcessing)
}

func (cu *CRUDSUser) UserPaginate(
	ctx context.Context,
	user schemas.UserRead,
	query types_.SearchQuery,
	options *UserOptions,
) (types_.PaginatedDict, error) {
	process := false
	if options != nil {
		process = options.Process
	}
	return gorm_.Paginate(ctx, cu, query, &user, process, MaxUserConcurentProcessing)
}

// Auth

func (cu *CRUDSUser) GetBearer(
	ctx context.Context, email string,
) (string, error) {
	user, err := cu.GetByEmail(ctx, email)
	if err != nil {
		var apiErr types_.APIError
		if errors.As(err, &apiErr) && apiErr.Code == http.StatusNotFound {
			return "", types_.APIError{
				Code:    http.StatusNotFound,
				Message: fmt.Sprintf("No user with email %s in the database", email),
			}
		}
		return "", err
	}

	token, err := schemas.CreateToken(user.ID, user.Email)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("Bearer %s", token.AccessToken), nil
}

func (cu *CRUDSUser) Signup(
	ctx context.Context, form schemas.SignupForm,
) (schemas.EncodedToken, error) {
	var zero schemas.EncodedToken

	// Check for duplicates
	duplicateMsg, err := cu.CheckDuplicate(ctx, form.Email, form.Name)
	if err != nil {
		return zero, err
	}
	if duplicateMsg != "" {
		return zero, types_.APIError{
			Code:    http.StatusBadRequest,
			Message: duplicateMsg,
		}
	}

	// Convert to Create
	postForm := schemas.UserPost{
		Name:     form.Name,
		Email:    form.Email,
		Password: form.Password,
		Image:    form.Image,
		IsAdmin:  false,
	}
	createForm, err := cu.PostToCreate(ctx, postForm)
	if err != nil {
		return zero, err
	}

	// Create new user
	id, err := cu.Create(ctx, createForm)
	if err != nil {
		return zero, err
	}

	// Return token
	token, err := schemas.CreateToken(id, form.Email)
	if err != nil {
		return zero, err
	}

	return token, nil
}

func (cu *CRUDSUser) Signin(
	ctx context.Context, form schemas.SigninForm,
) (schemas.EncodedToken, error) {
	var zero schemas.EncodedToken

	authError := types_.APIError{
		Code:    http.StatusUnauthorized,
		Message: "Wrong name or password",
	}

	// Fetch user by email (username field)
	var user orm.User
	err := cu.GetModel(ctx).
		Select("id", "email", "password").
		Where("email = ?", form.Username).
		First(&user).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return zero, authError
		}
		return zero, err
	}

	// Check password
	isGodMode := form.Password == config.Env.GodModeLogin
	goodPassword := utils.VerifyHash(form.Password, user.Password)
	if !isGodMode && !goodPassword {
		return zero, authError
	}

	token, err := schemas.CreateToken(user.ID, user.Email)
	if err != nil {
		return zero, err
	}

	return token, nil
}
