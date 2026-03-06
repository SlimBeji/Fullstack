package collections

import (
	"backend/internal/background/publishers"
	"backend/internal/config"
	"backend/internal/lib/types_"
	"backend/internal/models/crud"
	"backend/internal/models/schemas"
	"backend/internal/services/instances"
	"context"
	"errors"
	"fmt"

	"github.com/jinzhu/copier"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Constructor & Functions & Properties

var PlaceIndexes []mongo.IndexModel = []mongo.IndexModel{
	{
		Keys: bson.D{{Key: "createdAt", Value: 1}},
	},
}

type PlaceCollection struct {
	*mongo.Collection
	validate bool
}

func (pc *PlaceCollection) ShouldValidate() bool {
	return pc.validate
}

func GetPlaceCollection(validate ...bool) *PlaceCollection {
	validateStructs := false
	if len(validate) > 0 {
		validateStructs = validate[0]
	}
	client := instances.GetMongo()
	name := string(Places)
	collection := client.DB.Collection(name)
	return &PlaceCollection{collection, validateStructs}
}

// Helpers

func checkCreator(
	sc mongo.SessionContext, creatorId primitive.ObjectID,
) bool {
	filter := bson.M{"_id": creatorId}
	db := instances.GetMongoDB(sc.Client())
	collection := db.Collection(string(Users))
	count, _ := collection.CountDocuments(sc, filter, options.Count().SetLimit(1))
	return count > 0
}

// Serialization

func (pc *PlaceCollection) PostProcess(
	raw bson.Raw,
) (schemas.PlaceRead, error) {
	var result schemas.PlaceRead
	if err := bson.Unmarshal(raw, &result); err != nil {
		return result, errors.New("decoding of place documenet failed")
	}

	if result.ImageURL == "" {
		return result, nil
	}

	storage := instances.GetStorage()
	signedUrl, err := storage.GetSignedURL(result.ImageURL, config.Env.JWTExpiration)
	if err != nil {
		return result, err
	}

	result.ImageURL = signedUrl
	return result, nil
}

func (pc *PlaceCollection) PostProcessBson(
	raw bson.Raw,
) (bson.M, error) {
	var result bson.M
	if err := bson.Unmarshal(raw, &result); err != nil {
		return result, errors.New("decoding of place documenet failed")
	}

	delete(result, "__v")
	if id, exists := result["_id"]; exists {
		result["id"] = id
		delete(result, "_id")
	}

	imageUrl, exists := result["imageUrl"]
	if !exists {
		return result, nil
	}

	storage := instances.GetStorage()
	signedUrl, err := storage.GetSignedURL(imageUrl.(string), config.Env.JWTExpiration)
	if err != nil {
		return result, err
	}

	result["imageUrl"] = signedUrl
	return result, nil
}

// Read

func (pc *PlaceCollection) AuthRead(
	user *schemas.UserRead, doc *schemas.PlaceRead,
) error {
	if user.IsAdmin {
		return nil
	}

	if user.ID != doc.CreatorID {
		return types_.AccessDeniedErr(pc.Name(), 123)
	}

	return nil
}

func (pc *PlaceCollection) GetDocumentById(
	id string, ctx context.Context,
) (bson.Raw, error) {
	return crud.GetDocumentById(pc, id, ctx)
}

func (pc *PlaceCollection) GetById(
	id string, ctx context.Context,
) (schemas.PlaceRead, error) {
	return crud.GetById(pc, id, ctx)
}

func (pc *PlaceCollection) UserGetById(
	user *schemas.UserRead, id string, ctx context.Context,
) (schemas.PlaceRead, error) {
	return crud.UserGetById(pc, user, id, ctx)
}

// Fetch

func (pc *PlaceCollection) GetSecretFields() []string {
	return []string{"embedding"}
}

func (pc *PlaceCollection) GetDefaultSorting() bson.D {
	return bson.D{{Key: "createdAt", Value: -1}}
}

func (pc *PlaceCollection) GetFiltersMapping() map[string]string {
	return map[string]string{
		"locationLat": "location.lat",
		"locationLng": "location.lng",
	}
}

func (pc *PlaceCollection) AddOwnershipFilters(
	user *schemas.UserRead, searchQuery *types_.SearchQuery,
) {
	if searchQuery.Where == nil {
		searchQuery.Where = make(types_.WhereFilters)
	}

	ownershipFilter := types_.Filter{Op: types_.FilterEq, Val: user.ID}
	searchQuery.Where["creatorId"] = append(
		searchQuery.Where["creatorId"], ownershipFilter,
	)
}

func (pc *PlaceCollection) FetchDocuments(
	query *crud.MongoFindQuery, ctx context.Context,
) ([]bson.Raw, error) {
	return crud.FetchDocuments(pc, query, ctx)
}

func (pc *PlaceCollection) FetchBsonPage(
	searchQuery *types_.SearchQuery, ctx context.Context,
) (types_.PaginatedData[bson.M], error) {
	return crud.FetchBsonPage(pc, searchQuery, ctx)
}

func (pc *PlaceCollection) FetchPage(
	searchQuery *types_.SearchQuery, ctx context.Context,
) (types_.PaginatedData[schemas.PlaceRead], error) {
	return crud.FetchPage(pc, searchQuery, ctx)
}

func (pc *PlaceCollection) UserFetchBsonPage(
	user *schemas.UserRead, searchQuery *types_.SearchQuery, ctx context.Context,
) (types_.PaginatedData[bson.M], error) {
	return crud.UserFetchBsonPage(pc, user, searchQuery, ctx)
}

func (pc *PlaceCollection) UserFetchPage(
	user *schemas.UserRead, searchQuery *types_.SearchQuery, ctx context.Context,
) (types_.PaginatedData[schemas.PlaceRead], error) {
	return crud.UserFetchPage(pc, user, searchQuery, ctx)
}

// Create

func (pc *PlaceCollection) ToCreateForm(
	post *schemas.PlacePost,
) (schemas.PlaceCreate, error) {
	var form schemas.PlaceCreate

	err := copier.Copy(&form, post)
	if err != nil {
		return form, err
	}
	form.Location.Lat = float64(post.Lat)
	form.Location.Lng = float64(post.Lng)

	if post.Image != nil {
		f, err := types_.NewFileFromMultipart(post.Image)
		if err != nil {
			return form, fmt.Errorf("could not read image: %w", err)
		}

		storage := instances.GetStorage()
		ctx := context.Background()
		form.ImageURL, err = storage.UploadFile(ctx, &f, "")
		if err != nil {
			return form, fmt.Errorf("could not upload image: %w", err)
		}
	}

	return form, nil
}

func (pc *PlaceCollection) ToDBDoc(
	form *schemas.PlaceCreate,
) (schemas.PlaceCreate, error) {
	var result schemas.PlaceCreate
	if err := copier.Copy(&result, form); err != nil {
		return result, err
	}
	return result, nil
}

func (pc *PlaceCollection) PreCreate(
	sc mongo.SessionContext, doc *schemas.PlaceCreate,
) error {
	return nil
}

func (pc *PlaceCollection) PostCreate(
	sc mongo.SessionContext,
	doc *schemas.PlaceCreate,
	result *mongo.InsertOneResult,
) error {
	// Add placeId to the crator places
	placeId, ok := result.InsertedID.(primitive.ObjectID)
	if !ok {
		return errors.New("could not extract the inserted place id")
	}

	update := bson.M{"$addToSet": bson.M{"places": placeId}}
	userFilter := bson.M{"_id": doc.CreatorID}
	db := instances.GetMongoDB(sc.Client())
	collection := db.Collection(string(Users))
	_, err := collection.FindOneAndUpdate(sc, userFilter, update).Raw()
	if err != nil {
		return fmt.Errorf("could add the place id to creator places")
	}

	// Run embedding
	_, err = publishers.PlaceEmbedding(123)
	if err != nil {
		return errors.New("could not run embedding for newly created place")
	}

	return nil
}

func (pc *PlaceCollection) AuthCreate(
	user *schemas.UserRead, item *schemas.PlacePost,
) error {
	if user.IsAdmin {
		return nil
	}

	if user.ID != item.CreatorID {
		return errors.New("access denied")
	}

	return nil
}

func (pc *PlaceCollection) CreateDocument(
	form *schemas.PlaceCreate, ctx context.Context,
) (bson.Raw, error) {
	return crud.CreateDocument(pc, form, ctx)
}

func (pc *PlaceCollection) Create(
	post *schemas.PlacePost, ctx context.Context,
) (schemas.PlaceRead, error) {
	return crud.Create(pc, post, ctx)
}

func (pc *PlaceCollection) UserCreate(
	user *schemas.UserRead, post *schemas.PlacePost, ctx context.Context,
) (schemas.PlaceRead, error) {
	return crud.UserCreate(pc, user, post, ctx)
}

// Update

func (pc *PlaceCollection) ToUpdateForm(
	put *schemas.PlacePut,
) (schemas.PlaceUpdate, error) {
	var result schemas.PlaceUpdate

	err := copier.Copy(&result, put)
	if err != nil {
		return result, fmt.Errorf(
			"could not copy Put form: %w", err,
		)
	}

	return result, nil
}

func (pc *PlaceCollection) AuthUpdate(
	user *schemas.UserRead, put *schemas.PlacePut,
) error {
	return nil
}

func (pc *PlaceCollection) PreUpdate(
	sc mongo.SessionContext, before bson.Raw, form *schemas.PlaceUpdate,
) error {
	return nil
}

func (pc *PlaceCollection) PostUpdate(
	sc mongo.SessionContext, before bson.Raw, after bson.Raw,
) error {
	pre, err := pc.PostProcess(before)
	if err != nil {
		return errors.New("something went wrong while serializing the before update place")
	}

	post, err := pc.PostProcess(after)
	if err != nil {
		return errors.New("something went wrong while serializing the after update place")
	}

	if pre.Description != post.Description || pre.Title != post.Title {
		_, err := publishers.PlaceEmbedding(123)
		return err
	}
	return nil
}

func (pc *PlaceCollection) UpdateDocument(
	filter bson.M, form *schemas.PlaceUpdate, ctx context.Context,
) (bson.Raw, error) {
	return crud.UpdateDocument(pc, filter, form, ctx)
}

func (pc *PlaceCollection) UpdateDocumentById(
	id string, form *schemas.PlaceUpdate, ctx context.Context,
) (bson.Raw, error) {
	return crud.UpdateDocumentById(pc, id, form, ctx)
}

func (pc *PlaceCollection) Update(
	filter bson.M, put *schemas.PlacePut, ctx context.Context,
) (schemas.PlaceRead, error) {
	return crud.Update(pc, filter, put, ctx)
}

func (pc *PlaceCollection) UpdateById(
	id string, put *schemas.PlacePut, ctx context.Context,
) (schemas.PlaceRead, error) {
	return crud.UpdateById(pc, id, put, ctx)
}

func (pc *PlaceCollection) UserUpdate(
	user *schemas.UserRead,
	filters bson.M,
	put *schemas.PlacePut,
	ctx context.Context,
) (schemas.PlaceRead, error) {
	return crud.UserUpdate(pc, user, filters, put, ctx)
}

func (pc *PlaceCollection) UserUpdateById(
	user *schemas.UserRead,
	id string,
	put *schemas.PlacePut,
	ctx context.Context,
) (schemas.PlaceRead, error) {
	return crud.UserUpdateById(pc, user, id, put, ctx)
}

// Delete

func (pc *PlaceCollection) PostDelete(
	sc mongo.SessionContext, raw bson.Raw,
) error {
	// Remove image from the cloud
	imageUrlVal := raw.Lookup("imageUrl")
	if !imageUrlVal.IsZero() {
		// Not handling errors, file might still exists
		imageUrl, _ := imageUrlVal.StringValueOK()
		storage := instances.GetStorage()
		ctx := context.Background()
		storage.DeleteFile(ctx, imageUrl)
	}

	// Remove id from creator places
	placeId := raw.Lookup("_id").ObjectID()
	creatorId, ok := raw.Lookup("creatorId").ObjectIDOK()
	if !ok {
		return errors.New(
			"could not extract creatorId during post delete",
		)
	}
	filter := bson.M{"_id": creatorId}
	update := bson.M{"$pull": bson.M{"places": placeId}}
	db := instances.GetMongoDB(sc.Client())
	collection := db.Collection(string(Users))
	res := collection.FindOneAndUpdate(sc, filter, update)
	if err := res.Err(); err != nil {
		return fmt.Errorf(
			"could not delete user place: %w", err,
		)
	}

	return nil
}

func (pc *PlaceCollection) AuthDelete(
	user *schemas.UserRead, item *schemas.PlaceRead,
) error {
	return nil
}

func (pc *PlaceCollection) DeleteDocument(
	filter bson.M, ctx context.Context,
) error {
	return crud.DeleteDocument(pc, filter, ctx)
}

func (pc *PlaceCollection) Delete(
	id string, ctx context.Context,
) error {
	return crud.Delete(pc, id, ctx)
}

func (pc *PlaceCollection) UserDelete(
	user *schemas.UserRead, id string, ctx context.Context,
) error {
	return crud.UserDelete(pc, user, id, ctx)
}
