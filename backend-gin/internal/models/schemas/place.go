package schemas

import (
	"backend/internal/lib/types_"
	"backend/internal/lib/validator_"
	"mime/multipart"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// --- Fields ----

type Location struct {
	Lat types_.FlexFloat `json:"lat" example:"51.48180425016331" bson:"lat"`    // The latitude of the place
	Lng types_.FlexFloat `json:"lng" example:"-0.19090418688755467" bson:"lng"` // The longitude of the place
}

// --- Base Schemas ----

type PlaceDB struct {
	ID          primitive.ObjectID `bson:"_id,omitempty"`
	Title       string             `bson:"title"`
	Description string             `bson:"description"`
	Address     string             `bson:"address"`
	Location    Location           `bson:"location"`
	ImageUrl    string             `bson:"imageUrl"`
	Embedding   []types_.FlexFloat `bson:"embedding"`
	CreatorID   primitive.ObjectID `bson:"creatorId"`
	CreatedAt   time.Time          `bson:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt"`
}

type PlaceSeed struct {
	Ref         int
	CreatorRef  int
	Title       string
	Description string
	Address     string
	Location    Location
	Embedding   []types_.FlexFloat
	ImageUrl    string
}

// --- Creation Schemas ---

type PlaceCreate struct {
	Title       string             `json:"title" validate:"min=10"`
	Description string             `json:"description" validate:"min=10" `
	Address     string             `json:"address" validate:"min=10" `
	Location    Location           `json:"location" `
	Embedding   []types_.FlexFloat `json:"embedding" validate:"len=0|len=384" `
	ImageUrl    string             `json:"imageUrl" validate:"omitempty" `
	CreatorID   primitive.ObjectID `json:"creatorId" `
}

type PlacePost struct {
	Title       string                `json:"title" form:"title" validate:"min=10" example:"Stamford Bridge"`                               // The place title/name, 10 characters minimum
	Description string                `json:"description" form:"description" validate:"min=10" example:"Stadium of Chelsea football club" ` // The place description, 10 characters minimum
	Address     string                `json:"address" form:"address" validate:"min=10" example:"Fulham road" `                              // The place address
	Lat         types_.FlexFloat      `json:"lat" form:"lat" example:"51.48180425016331" `                                                  // The latitude of the place
	Lng         types_.FlexFloat      `json:"lng" form:"lng" example:"-0.19090418688755467" `                                               // The longitude of the place
	Image       *multipart.FileHeader `json:"image" form:"image" validate:"omitempty" swaggerignore:"true"`                                 // Place Image (JPEG)
	CreatorID   string                `json:"creatorId" form:"creatorId" validate:"hexadecimal,len=24" example:"683b21134e2e5d46978daf1f" ` // The ID of the place creator, 24 characters
}

// --- Read Schemas ---

type PlaceRead struct {
	ID          primitive.ObjectID `json:"id" validate:"hexadecimal,len=24" example:"683b21134e2e5d46978daf1f" `                      // The ID of the place 24 characters
	Title       string             `json:"title" validate:"min=10" example:"Stamford Bridge" `                                        // The place title/name, 10 characters minimum
	Description string             `json:"description" validate:"min=10" example:"Stadium of Chelsea football club" `                 // The place description, 10 characters minimum
	Address     string             `json:"address" validate:"min=10" example:"Fulham road" `                                          // The place address
	Location    Location           `json:"location" `                                                                                 // Location object (can be sent as JSON string)
	ImageUrl    string             `json:"imageUrl" validate:"omitempty" example:"avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg" ` // local url on the storage
	CreatorID   primitive.ObjectID `json:"creatorId" validate:"hexadecimal,len=24" example:"683b21134e2e5d46978daf1f" `               // The ID of the place creator, 24 characters
	CreatedAt   time.Time          `json:"createdAt" example:"2024-01-12T10:15:30.000Z"`                                              // creation datetime
	UpdatedAt   time.Time          `json:"updatedAt" example:"2024-01-12T10:15:30.000Z"`                                              // last update datetime
}

type PlaceGet struct {
	Fields []string `json:"fields" validate:"dive,oneof=id title description address location.lat location.lng imageUrl creatorId createdAt" example:"id,title"` // Fields to include in the response; omit for full document
}

func (pg PlaceGet) FromRequest(c *gin.Context) (PlaceGet, []string) {
	result := PlaceGet{}
	fieldsRaw, _ := c.GetQuery("fields")
	result.Fields = strings.Split(fieldsRaw, ",")
	// No errors to return, field optional
	return result, []string{}
}

// --- Update Schemas ---

type PlaceUpdate struct {
	Title       *string   `json:"title" validate:"omitempty,min=10" `
	Description *string   `json:"description" validate:"omitempty,min=10" `
	Address     *string   `json:"address" validate:"omitempty,min=10" `
	Location    *Location `json:"location" validate:"omitempty" `
}

type PlacePut struct {
	Title       *string   `json:"title" validate:"omitempty,min=10" example:"Stamford Bridge" `                        // The place title/name, 10 characters minimum
	Description *string   `json:"description" validate:"omitempty,min=10" example:"Stadium of Chelsea football club" ` // The place description, 10 characters minimum
	Address     *string   `json:"address" validate:"omitempty,min=10" example:"Fulham road" `                          // The place address
	Location    *Location `json:"location" validate:"omitempty" `                                                      // Location object (can be sent as JSON string)
}

// --- Search Schemas ---

type PlacesPaginated = types_.PaginatedData[PlaceRead]

type PlaceFilters struct {
	Page        int      `json:"page" default:"1" validate:"gte=1"`                                                                                                   // The page number
	Size        int      `json:"size" default:"100" validate:"lte=100,gte=1"`                                                                                         // Items per page
	Sort        []string `json:"sort" validate:"dive,oneof=createdAt -createdAt title -title description -description address -address" example:"createdAt"`          // Fields to use for sorting. Use the '-' for descending sorting
	Fields      []string `json:"fields" validate:"dive,oneof=id title description address location.lat location.lng imageUrl creatorId createdAt" example:"id,title"` // Fields to include in the response; omit for full document
	Id          []string `json:"id" form:"id" example:"683b21134e2e5d46978daf1f" collectionFormat:"multi"`                                                            // The ID of the place 24 characters
	Title       []string `json:"title" form:"title" example:"eq:Some Place" collectionFormat:"multi"`                                                                 // The place title/name, 10 characters minimum
	Description []string `json:"description" form:"description" example:"like:football" collectionFormat:"multi"`                                                     // The place description, 10 characters minimum
	Address     []string `json:"address" form:"address" example:"like:Boulevard" collectionFormat:"multi"`                                                            // The place address
	CreatorId   []string `json:"creatorId" form:"creatorId" example:"eq:683b21134e2e5d46978daf1f" collectionFormat:"multi"`                                           // The ID of the place creator, 24 characters
	LocationLat []string `json:"locationLat" form:"locationLat" example:"gt:3.5" collectionFormat:"multi"`                                                            // The latitude of the place
	LocationLng []string `json:"locationLng" form:"locationLng" example:"lt:4.5" collectionFormat:"multi"`                                                            // The longitude of the place
}

func (pf PlaceFilters) ToSearchQuery() (types_.SearchQuery, error) {
	errorsMap := make(map[string][]string)

	// Helper to collect errors
	addErrors := func(field string, errors []string) {
		if len(errors) > 0 {
			errorsMap[field] = errors
		}
	}

	idFilters, errs := validator_.ToIndexFilters(pf.Id)
	addErrors("id", errs)

	titleFilters, errs := validator_.ToStringFilters(pf.Title, "min=10")
	addErrors("title", errs)

	descriptionFilters, errs := validator_.ToStringFilters(pf.Description, "min=10")
	addErrors("description", errs)

	addressFilters, errs := validator_.ToStringFilters(pf.Address, "min=10")
	addErrors("address", errs)

	creatorFilters, errs := validator_.ToIndexFilters(pf.CreatorId)
	addErrors("creatorId", errs)

	latFilters, errs := validator_.ToFloat64Filters(pf.LocationLat, "")
	addErrors("locationLat", errs)

	lngFilters, errs := validator_.ToFloat64Filters(pf.LocationLng, "")
	addErrors("locationLng", errs)

	if len(errorsMap) > 0 {
		err := types_.MapToValidationErrs("invalid place filters", errorsMap)
		return types_.SearchQuery{}, err
	}

	return types_.SearchQuery{
		Page:    pf.Page,
		Size:    pf.Size,
		OrderBy: pf.Sort,
		Select:  pf.Fields,
		Where: types_.WhereFilters{
			"id":          idFilters,
			"title":       titleFilters,
			"description": descriptionFilters,
			"address":     addressFilters,
			"creatorId":   creatorFilters,
			"locationLat": latFilters,
			"locationLng": lngFilters,
		},
	}, nil
}
