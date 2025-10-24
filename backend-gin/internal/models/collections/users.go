package collections

import (
	"backend/internal/lib/clients"
	"backend/internal/models/crud"
	"backend/internal/models/schemas"
	"backend/internal/types_"
	"context"
	"fmt"

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
