package collections

import (
	"backend/internal/lib/clients"
	"backend/internal/models/crud"
	"backend/internal/models/schemas"
	"backend/internal/types_"
	"context"
	"fmt"
	"net/http"
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
	return form, err
}

func (uc *UserCollection) ToDBDoc(
	form *schemas.UserCreate,
) (schemas.UserDB, error) {
	var result schemas.UserDB
	if err := copier.Copy(&result, form); err != nil {
		return result, err
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

func (uc *UserCollection) CreateDocument(
	form *schemas.UserCreate, ctx context.Context,
) (bson.Raw, error) {
	return crud.CreateDocument(uc, form, ctx)
}

func (uc *UserCollection) Create(
	post *schemas.UserPost, ctx context.Context,
) (schemas.UserRead, error) {
	return crud.Create(uc, post, ctx)
}

func (uc *UserCollection) UserCreate(
	user *schemas.UserRead, post *schemas.UserPost, ctx context.Context,
) (schemas.UserRead, error) {
	return crud.UserCreate(uc, user, post, ctx)
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
