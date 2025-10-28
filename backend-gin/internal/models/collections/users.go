package collections

import (
	"backend/internal/config"
	"backend/internal/lib/clients"
	"backend/internal/lib/encryption"
	"backend/internal/models/crud"
	"backend/internal/models/schemas"
	"backend/internal/types_"
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/jinzhu/copier"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// Constructor & Functions & Properties

type UserCollection struct {
	*mongo.Collection
}

func NewUserCollection() *UserCollection {
	client := clients.GetMongo()
	name := string(types_.CollectionUsers)
	collection := client.DB.Collection(name)
	return &UserCollection{collection}
}

// Serialization

func (uc *UserCollection) PostProcess(item *schemas.UserRead) error {
	if item.ImageUrl == "" {
		return nil
	}

	storage := clients.GetStorage()
	signedUrl, err := storage.GetSignedUrl(item.ImageUrl)
	if err != nil {
		return err
	}

	item.ImageUrl = signedUrl
	return nil
}

func (uc *UserCollection) PostProcessBson(item bson.M) error {
	imageUrl, exists := item["imageUrl"]
	if !exists {
		return nil
	}

	storage := clients.GetStorage()
	signedUrl, err := storage.GetSignedUrl(imageUrl.(string))
	if err != nil {
		return err
	}

	item["imageUrl"] = signedUrl
	return nil
}

// Read

func (uc *UserCollection) AuthRead(
	user *schemas.UserRead, doc *schemas.UserRead,
) error {
	if doc == nil {
		return fmt.Errorf("no document provided")
	}

	if user == nil {
		return types_.NotAuthenticatedErr()
	}

	if user.IsAdmin {
		return nil
	}

	if user.Id != doc.Id {
		return types_.AccessDeiniedErr(uc.Name(), doc.Id)
	}

	return nil
}

func (uc *UserCollection) GetDocumentById(
	id string, ctx context.Context,
) (bson.Raw, error) {
	return crud.GetDocumentById(uc, id, ctx)
}

func (uc *UserCollection) GetById(
	id string, ctx context.Context,
) (schemas.UserRead, error) {
	return crud.GetById(uc, id, ctx)
}

func (uc *UserCollection) CheckDuplicate(
	email string, name string, ctx context.Context,
) error {
	// Used by the Signup method
	// Check the logic there before modifying error format

	filter := bson.M{"$or": []bson.M{
		{"email": email},
		{"name": name},
	}}
	found, err := crud.Get(uc, filter, ctx)
	if err == nil {
		if found.Email == email {
			return fmt.Errorf("email %s is already used", email)
		}
		if found.Name == name {
			return fmt.Errorf("name %s is already used", name)
		}
	}

	apiErr, ok := err.(types_.ApiError)
	if ok {
		if apiErr.Code == http.StatusNotFound {
			return nil
		}
	}
	return err
}

func (uc *UserCollection) GetByEmail(
	email string, ctx context.Context,
) (schemas.UserRead, error) {
	return crud.Get(uc, bson.M{"email": email}, ctx)
}

func (uc *UserCollection) GetBearer(
	email string, ctx context.Context,
) (string, error) {
	user, err := uc.GetByEmail(email, ctx)
	if err != nil {
		return "", fmt.Errorf(
			"could not extract user with email %s: %w", email, err,
		)
	}

	token, err := encryption.CreateToken(user.Id, user.Email)
	if err != nil {
		return "", fmt.Errorf("could not create token for user %s: %w", email, err)
	}

	return "Bearer " + token.AccessToken, nil
}

func (uc *UserCollection) UserGetById(
	user *schemas.UserRead, id string, ctx context.Context,
) (schemas.UserRead, error) {
	return crud.UserGetById(uc, user, id, ctx)
}

// Fetch

func (uc *UserCollection) GetSecretFields() []string {
	return []string{"password"}
}

func (uc *UserCollection) GetDefaultSorting() bson.D {
	return bson.D{{Key: "createdAt", Value: -1}}
}

func (uc *UserCollection) GetFiltersMapping() map[string]string {
	return map[string]string{}
}

func (uc *UserCollection) AddOwnershipFilters(
	user *schemas.UserRead, findQuery *types_.FindQuery,
) {
	if findQuery.Filters == nil {
		findQuery.Filters = make(types_.FindQueryFilters)
	}

	ownershipFilter := types_.Filter{Op: types_.FilterEq, Val: user.Id}
	findQuery.Filters["id"] = append(findQuery.Filters["id"], ownershipFilter)
}

func (uc *UserCollection) FetchDocuments(
	query *types_.MongoFindQuery, ctx context.Context,
) ([]bson.Raw, error) {
	return crud.FetchDocuments(uc, query, ctx)
}

func (uc *UserCollection) FetchBsonPage(
	findQuery *types_.FindQuery, ctx context.Context,
) (types_.RecordsPaginated[bson.M], error) {
	return crud.FetchBsonPage(uc, findQuery, ctx)
}

func (uc *UserCollection) FetchPage(
	findQuery *types_.FindQuery, ctx context.Context,
) (types_.RecordsPaginated[schemas.UserRead], error) {
	return crud.FetchPage(uc, findQuery, ctx)
}

func (uc *UserCollection) UserFetchBsonPage(
	user *schemas.UserRead, findQuery *types_.FindQuery, ctx context.Context,
) (types_.RecordsPaginated[bson.M], error) {
	return crud.UserFetchBsonPage(uc, user, findQuery, ctx)
}

func (uc *UserCollection) UserFetchPage(
	user *schemas.UserRead, findQuery *types_.FindQuery, ctx context.Context,
) (types_.RecordsPaginated[schemas.UserRead], error) {
	return crud.UserFetchPage(uc, user, findQuery, ctx)
}

// Create

func (uc *UserCollection) ToCreateForm(
	post *schemas.UserPost,
) (schemas.UserCreate, error) {
	var form schemas.UserCreate
	err := copier.Copy(&form, post)
	if err != nil {
		return form, err
	}

	form.Password, err = encryption.HashInput(form.Password)
	if err != nil {
		return form, fmt.Errorf("could not hash password: %w", err)
	}

	if post.Image != nil {
		var f types_.FileToUpload
		f.FromMultipartHeader(post.Image)
		storage := clients.GetStorage()
		form.ImageUrl, err = storage.UploadFile(&f)
		if err != nil {
			return form, fmt.Errorf("could not upload image: %w", err)
		}
	}

	return form, nil
}

func (uc *UserCollection) ToDBDoc(
	form *schemas.UserCreate,
) (schemas.UserDB, error) {
	var result schemas.UserDB
	if err := copier.Copy(&result, form); err != nil {
		return result, err
	}

	if !encryption.IsHashed(result.Password) {
		return result, fmt.Errorf("password field is not hashed")
	}

	result.UpdatedAt = time.Now()
	result.CreatedAt = time.Now()
	result.Places = []string{}
	return result, nil
}

func (uc *UserCollection) PostCreate(sc mongo.SessionContext) error {
	return nil
}

func (uc *UserCollection) AuthCreate(
	user *schemas.UserRead, item *schemas.UserPost,
) error {
	if user.IsAdmin {
		return nil
	}
	return fmt.Errorf("only admins can create new users")
}

func checkGetError(err error) error {
	if err == nil {
		return nil
	}

	if strings.Contains(err.Error(), "E11000 duplicate key error collection") {
		return types_.ApiError{
			Code:    http.StatusUnprocessableEntity,
			Message: "Email or Username already exists",
		}
	}
	return err
}

func (uc *UserCollection) CreateDocument(
	form *schemas.UserCreate, ctx context.Context,
) (bson.Raw, error) {
	result, err := crud.CreateDocument(uc, form, ctx)
	return result, checkGetError(err)
}

func (uc *UserCollection) Create(
	post *schemas.UserPost, ctx context.Context,
) (schemas.UserRead, error) {
	result, err := crud.Create(uc, post, ctx)
	return result, checkGetError(err)
}

func (uc *UserCollection) UserCreate(
	user *schemas.UserRead, post *schemas.UserPost, ctx context.Context,
) (schemas.UserRead, error) {
	result, err := crud.UserCreate(uc, user, post, ctx)
	return result, checkGetError(err)
}

// User Auth Methods

func (uc *UserCollection) createToken(
	id string, email string,
) (schemas.EncodedToken, error) {
	token, err := encryption.CreateToken(id, email)
	if err != nil {
		var zero schemas.EncodedToken
		return zero, types_.ApiError{
			Code:    http.StatusInternalServerError,
			Message: "Could not generate token. Try to sign in again",
			Err:     err,
		}
	}
	return token, nil
}

func (uc *UserCollection) Signup(
	form *schemas.SignupForm, ctx context.Context,
) (schemas.EncodedToken, error) {
	var result schemas.EncodedToken
	err := uc.CheckDuplicate(form.Email, form.Name, ctx)
	if err != nil {
		errStr := err.Error()
		if strings.Contains(errStr, "is already used") {
			return result, types_.ApiError{
				Code:    http.StatusBadRequest,
				Message: errStr,
			}
		} else {
			return result, types_.ApiError{
				Code:    http.StatusInternalServerError,
				Message: "Something went wrong during signup",
				Err:     err,
			}
		}
	}

	postForm := schemas.UserPost{
		Name:     form.Name,
		Email:    form.Email,
		IsAdmin:  false,
		Password: form.Password,
		Image:    form.Image,
	}

	user, err := uc.Create(&postForm, ctx)
	if err != nil {
		return result, types_.ApiError{
			Code:    http.StatusInternalServerError,
			Message: "Something went wrong during signup",
			Err:     err,
		}
	}

	return uc.createToken(user.Id, user.Email)
}

func (uc *UserCollection) Signin(
	form *schemas.SigninForm, ctx context.Context,
) (schemas.EncodedToken, error) {
	var result schemas.EncodedToken

	raw, err := crud.GetDocument(uc, bson.M{"email": form.Username}, ctx)
	if err != nil {
		return result, types_.ApiError{
			Code:    http.StatusNotFound,
			Message: fmt.Sprintf("could not find user %s", form.Username),
		}
	}

	hashedPassword := raw.Lookup("password").StringValue()
	isValidPassword := encryption.VerifyHash(form.Password, hashedPassword)
	isGodMode := form.Password == config.Env.GodModeLogin
	if !isValidPassword && !isGodMode {
		return result, types_.ApiError{
			Code:    http.StatusUnauthorized,
			Message: "wrong name or password",
		}
	}

	id := string(raw.Lookup("_id").Value)
	email := string(raw.Lookup("email").Value)
	if id == "" || email == "" {
		return result, types_.ApiError{
			Code:    http.StatusInternalServerError,
			Message: "something wen wrong while generating token",
		}
	}
	return uc.createToken(id, email)
}

// Update

func (uc *UserCollection) ToUpdateForm(
	put *schemas.UserPut,
) (schemas.UserUpdate, error) {
	return *put, nil
}

func (uc *UserCollection) AuthUpdate(
	user *schemas.UserRead, put *schemas.UserPut,
) error {
	return nil
}

func (uc *UserCollection) PostUpdate(sc mongo.SessionContext) error {
	return nil
}

func (uc *UserCollection) UpdateDocument(
	filter bson.M, form *schemas.UserUpdate, ctx context.Context,
) (bson.Raw, error) {
	return crud.UpdateDocument(uc, filter, form, ctx)
}

func (uc *UserCollection) UpdateDocumentById(
	id string, form *schemas.UserUpdate, ctx context.Context,
) (bson.Raw, error) {
	return crud.UpdateDocumentById(uc, id, form, ctx)
}

func (uc *UserCollection) Update(
	filter bson.M, put *schemas.UserPut, ctx context.Context,
) (schemas.UserRead, error) {
	return crud.Update(uc, filter, put, ctx)
}

func (uc *UserCollection) UpdateById(
	id string, put *schemas.UserPut, ctx context.Context,
) (schemas.UserRead, error) {
	return crud.UpdateById(uc, id, put, ctx)
}

func (uc *UserCollection) UserUpdate(
	user *schemas.UserRead,
	filters bson.M,
	put *schemas.UserUpdate,
	ctx context.Context,
) (schemas.UserRead, error) {
	return crud.UserUpdate(uc, user, filters, put, ctx)
}

func (uc *UserCollection) UserUpdateById(
	user *schemas.UserRead,
	id string,
	put *schemas.UserUpdate,
	ctx context.Context,
) (schemas.UserRead, error) {
	return crud.UserUpdateById(uc, user, id, put, ctx)
}

// Delete

func (uc *UserCollection) PostDelete(sc mongo.SessionContext) error {
	return nil
}

func (uc *UserCollection) AuthDelete(
	user *schemas.UserRead, item *schemas.UserRead,
) error {
	return nil
}

func (uc *UserCollection) DeleteDocument(
	filter bson.M, ctx context.Context,
) error {
	return crud.DeleteDocument(uc, filter, ctx)
}

func (uc *UserCollection) Delete(
	id string, ctx context.Context,
) error {
	return crud.Delete(uc, id, ctx)
}

func (uc *UserCollection) UserDelete(
	user *schemas.UserRead, id string, ctx context.Context,
) error {
	return crud.UserDelete(uc, user, id, ctx)
}
