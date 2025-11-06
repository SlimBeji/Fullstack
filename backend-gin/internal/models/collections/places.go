package collections

import (
	"backend/internal/lib/clients"
	"backend/internal/models/crud"
	"backend/internal/models/schemas"
	"backend/internal/types_"
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jinzhu/copier"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// Constructor & Functions & Properties

type PlaceCollection struct {
	*mongo.Collection
}

var PlaceCol *PlaceCollection

func NewPlaceCollection() *PlaceCollection {
	client := clients.GetMongo()
	name := string(types_.CollectionPlaces)
	collection := client.DB.Collection(name)
	return &PlaceCollection{collection}
}

func GetPlaceCollection() *PlaceCollection {
	if PlaceCol == nil {
		PlaceCol = NewPlaceCollection()
	}
	return PlaceCol
}

// Serialization

func (pc *PlaceCollection) PostProcess(item *schemas.PlaceRead) error {
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

func (pc *PlaceCollection) PostProcessBson(item bson.M) error {
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

func (pc *PlaceCollection) AuthRead(
	user *schemas.UserRead, doc *schemas.PlaceRead,
) error {
	if user.IsAdmin {
		return nil
	}

	if user.Id != doc.CreatorID {
		return types_.AccessDeiniedErr(pc.Name(), doc.ID)
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
	user *schemas.UserRead, findQuery *types_.FindQuery,
) {
	if findQuery.Filters == nil {
		findQuery.Filters = make(types_.FindQueryFilters)
	}

	ownershipFilter := types_.Filter{Op: types_.FilterEq, Val: user.Id}
	userId, err := primitive.ObjectIDFromHex(user.Id)
	if err == nil {
		ownershipFilter = types_.Filter{Op: types_.FilterEq, Val: userId}
	}

	findQuery.Filters["creatorId"] = append(
		findQuery.Filters["creatorId"], ownershipFilter,
	)
}

func (pc *PlaceCollection) FetchDocuments(
	query *types_.MongoFindQuery, ctx context.Context,
) ([]bson.Raw, error) {
	return crud.FetchDocuments(pc, query, ctx)
}

func (pc *PlaceCollection) FetchBsonPage(
	findQuery *types_.FindQuery, ctx context.Context,
) (types_.RecordsPaginated[bson.M], error) {
	return crud.FetchBsonPage(pc, findQuery, ctx)
}

func (pc *PlaceCollection) FetchPage(
	findQuery *types_.FindQuery, ctx context.Context,
) (types_.RecordsPaginated[schemas.PlaceRead], error) {
	return crud.FetchPage(pc, findQuery, ctx)
}

func (pc *PlaceCollection) UserFetchBsonPage(
	user *schemas.UserRead, findQuery *types_.FindQuery, ctx context.Context,
) (types_.RecordsPaginated[bson.M], error) {
	return crud.UserFetchBsonPage(pc, user, findQuery, ctx)
}

func (pc *PlaceCollection) UserFetchPage(
	user *schemas.UserRead, findQuery *types_.FindQuery, ctx context.Context,
) (types_.RecordsPaginated[schemas.PlaceRead], error) {
	return crud.UserFetchPage(pc, user, findQuery, ctx)
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
	form.Location.Lat = post.Lat
	form.Location.Lng = post.Lng

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

func (pc *PlaceCollection) ToDBDoc(
	form *schemas.PlaceCreate,
) (schemas.PlaceDB, error) {
	var result schemas.PlaceDB
	if err := copier.Copy(&result, form); err != nil {
		return result, err
	}

	result.UpdatedAt = time.Now()
	result.CreatedAt = time.Now()
	result.Embedding = []float64{}

	objectId, err := primitive.ObjectIDFromHex(form.CreatorID)
	if err != nil {
		return result, fmt.Errorf(
			"could not convert %s to an object id", form.CreatorID,
		)
	}
	result.CreatorID = objectId

	return result, nil
}

func (pc *PlaceCollection) PreCreate(
	sc mongo.SessionContext, doc *schemas.PlaceDB,
) error {
	return nil
}

func (pc *PlaceCollection) PostCreate(
	sc mongo.SessionContext,
	doc *schemas.PlaceDB,
	result *mongo.InsertOneResult,
) error {
	return nil
}

func (pc *PlaceCollection) AuthCreate(
	user *schemas.UserRead, item *schemas.PlacePost,
) error {
	if user.IsAdmin {
		return nil
	}

	if user.Id != item.CreatorID {
		return types_.AccessDeiniedErr(
			string(types_.CollectionUsers), item.CreatorID,
		)
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
	creatorId := put.CreatorID
	if creatorId == nil {
		return nil
	}

	if user.IsAdmin {
		return nil
	}

	if user.Id == *creatorId {
		return nil
	}

	return types_.AccessDeiniedErr(
		string(types_.CollectionUsers), *creatorId,
	)
}

func (pc *PlaceCollection) PostUpdate(sc mongo.SessionContext) error {
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
	put *schemas.PlaceUpdate,
	ctx context.Context,
) (schemas.PlaceRead, error) {
	return crud.UserUpdate(pc, user, filters, put, ctx)
}

func (pc *PlaceCollection) UserUpdateById(
	user *schemas.UserRead,
	id string,
	put *schemas.PlaceUpdate,
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
		storage := clients.GetStorage()
		storage.DeleteFile(imageUrl)
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
	db := clients.GetMongoDB(sc.Client())
	collection := db.Collection(string(types_.CollectionUsers))
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
