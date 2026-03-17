package schemas

import (
	"backend/internal/lib/types_"
	"backend/internal/lib/validator_"
	"mime/multipart"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// --- Selectables, Serchables, Sortables ----

type PlaceSelectables string

const (
	PlaceSelectId          PlaceSelectables = "id"
	PlaceSelectTitle       PlaceSelectables = "title"
	PlaceSelectDescription PlaceSelectables = "description"
	PlaceSelectAddress     PlaceSelectables = "address"
	PlaceSelectLocation    PlaceSelectables = "location"
	PlaceSelectImageURL    PlaceSelectables = "image_url"
	PlaceSelectCreatorId   PlaceSelectables = "creator_id"
	PlaceSelectCreatedAt   PlaceSelectables = "created_at"
)

func (field PlaceSelectables) Validate() bool {
	switch field {
	case PlaceSelectId, PlaceSelectTitle, PlaceSelectDescription, PlaceSelectAddress,
		PlaceSelectLocation, PlaceSelectImageURL, PlaceSelectCreatorId, PlaceSelectCreatedAt:
		return true
	default:
		return false
	}
}

type PlaceSearchables string

const (
	PlaceSearchId          PlaceSearchables = "id"
	PlaceSearchTitle       PlaceSearchables = "title"
	PlaceSearchDescription PlaceSearchables = "description"
	PlaceSearchAddress     PlaceSearchables = "address"
	PlaceSearchCreatorId   PlaceSearchables = "creator_id"
	PlaceSearchLocationLat PlaceSearchables = "location_lat"
	PlaceSearchLocationLng PlaceSearchables = "location_lng"
)

func (field PlaceSearchables) Validate() bool {
	switch field {
	case PlaceSearchId, PlaceSearchTitle, PlaceSearchDescription, PlaceSearchAddress,
		PlaceSearchCreatorId, PlaceSearchLocationLat, PlaceSearchLocationLng:
		return true
	default:
		return false
	}
}

type PlaceSortables string

const (
	PlaceSortCreatedAtAsc    PlaceSortables = "created_at"
	PlaceSortCreatedAtDesc   PlaceSortables = "-created_at"
	PlaceSortTitleAsc        PlaceSortables = "title"
	PlaceSortTitleDesc       PlaceSortables = "-title"
	PlaceSortDescriptionAsc  PlaceSortables = "description"
	PlaceSortDescriptionDesc PlaceSortables = "-description"
	PlaceSortAddressAsc      PlaceSortables = "address"
	PlaceSortAddressDesc     PlaceSortables = "-address"
)

func (field PlaceSortables) Validate() bool {
	switch field {
	case PlaceSortCreatedAtAsc, PlaceSortCreatedAtDesc,
		PlaceSortTitleAsc, PlaceSortTitleDesc,
		PlaceSortDescriptionAsc, PlaceSortDescriptionDesc,
		PlaceSortAddressAsc, PlaceSortAddressDesc:
		return true
	default:
		return false
	}
}

// --- Fields ----

type Location struct {
	Lat float64 `json:"lat" example:"51.48180425016331"`    // The latitude of the place
	Lng float64 `json:"lng" example:"-0.19090418688755467"` // The longitude of the place
}

// used for POST requests
type FlexLocation struct {
	Lat types_.FlexFloat `json:"lat" example:"51.48180425016331"`    // The latitude of the place
	Lng types_.FlexFloat `json:"lng" example:"-0.19090418688755467"` // The longitude of the place
}

// --- Base Schemas ----

type PlaceSeed struct {
	Ref         int
	CreatorRef  int
	Title       string
	Description string
	Address     string
	Location    Location
	Embedding   []float32
	ImageURL    string
}

// --- Creation Schemas ---

type PlaceCreate struct {
	Title       string    `json:"title" validate:"min=10"`
	Description string    `json:"description" validate:"min=10" `
	Address     string    `json:"address" validate:"min=1" `
	Location    Location  `json:"location" `
	Embedding   []float32 `json:"embedding" validate:"len=0|len=384" `
	ImageURL    string    `json:"image_url" validate:"omitempty" `
	CreatorID   uint      `json:"creator_id" `
}

type PlacePost struct {
	Title       string                `json:"title" form:"title" validate:"required,min=10" example:"Stamford Bridge"`                               // The place title/name, 10 characters minimum
	Description string                `json:"description" form:"description" validate:"required,min=10" example:"Stadium of Chelsea football club" ` // The place description, 10 characters minimum
	Address     string                `json:"address" form:"address" validate:"required,min=1" example:"Fulham road" `                               // The place address
	Lat         types_.FlexFloat      `json:"lat" form:"lat" validate:"required" example:"51.48180425016331" `                                       // The latitude of the place
	Lng         types_.FlexFloat      `json:"lng" form:"lng" validate:"required" example:"-0.19090418688755467" `                                    // The longitude of the place
	Image       *multipart.FileHeader `json:"image" form:"image" validate:"omitempty" swaggerignore:"true"`                                          // Place Image (JPEG)
	CreatorID   uint                  `json:"creator_id" form:"creator_id" validate:"required" example:"123456789" `                                 // The ID of the place creator
}

// --- Read Schemas ---

type PlaceRead struct {
	ID          uint      `json:"id" example:"123456789" `                                                                    // The ID of the place
	Title       string    `json:"title" validate:"min=10" example:"Stamford Bridge" `                                         // The place title/name, 10 characters minimum
	Description string    `json:"description" validate:"min=10" example:"Stadium of Chelsea football club" `                  // The place description, 10 characters minimum
	Address     string    `json:"address" validate:"min=1" example:"Fulham road" `                                            // The place address
	Location    Location  `json:"location" `                                                                                  // Location object (can be sent as JSON string)
	ImageURL    string    `json:"image_url" validate:"omitempty" example:"avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg" ` // image url
	CreatorID   uint      `json:"creator_id" example:"123456789" `                                                            // The ID of the place creator
	CreatedAt   time.Time `json:"created_at" example:"2024-01-12T10:15:30.000Z"`                                              // creation datetime                                            // last update datetime
}

type PlaceGet struct {
	Fields []string `json:"fields" validate:"dive,oneof=id title description address location image_url creator_id created_at" enums:"id,title,description,address,location,image_url,creator_id,created_at" example:"id,title"` // Fields to include in the response; omit for full document
}

func (pg PlaceGet) FromRequest(c *gin.Context) (PlaceGet, []string) {
	result := PlaceGet{}
	fieldsRaw, _ := c.GetQuery("fields")
	if fieldsRaw == "" {
		return result, []string{}
	}
	result.Fields = strings.Split(fieldsRaw, ",")
	// No errors to return, field optional
	return result, []string{}
}

// --- Update Schemas ---

type PlaceUpdate = map[string]any

type PlacePut struct {
	Title       *string       `json:"title" validate:"omitempty,min=10" example:"Stamford Bridge" `                        // The place title/name, 10 characters minimum
	Description *string       `json:"description" validate:"omitempty,min=10" example:"Stadium of Chelsea football club" ` // The place description, 10 characters minimum
	Address     *string       `json:"address" validate:"omitempty,min=1" example:"Fulham road" `                           // The place address
	Location    *FlexLocation `json:"location" validate:"omitempty" `                                                      // Location object (can be sent as JSON string)
}

// --- Search Schemas ---

type PlacesPaginated = types_.PaginatedData[PlaceRead]

type PlaceSearch struct {
	Page        int                `json:"page" default:"1" validate:"gte=1"`                                                                                                                                                                                    // The page number
	Size        int                `json:"size" default:"100" validate:"lte=100,gte=1"`                                                                                                                                                                          // Items per page
	Sort        []string           `json:"sort" validate:"dive,oneof=created_at -created_at title -title description -description address -address" enums:"created_at,-created_at,title,-title,description,-description,address,-address" example:"-created_at"` // Fields to use for sorting. Use the '-' for descending sorting
	Fields      []string           `json:"fields" validate:"dive,oneof=id title description address location image_url creator_id created_at" enums:"id,title,description,address,location,image_url,creator_id,created_at"  example:"id,location"`              // Fields to include in the response; omit for full document
	Id          types_.FlexStrList `json:"id" form:"id" example:"123456789" collectionFormat:"multi"`                                                                                                                                                            // The ID of the place
	Title       types_.FlexStrList `json:"title" form:"title" example:"eq:Some Place" collectionFormat:"multi"`                                                                                                                                                  // The place title/name, 10 characters minimum
	Description types_.FlexStrList `json:"description" form:"description" example:"like:football" collectionFormat:"multi"`                                                                                                                                      // The place description, 10 characters minimum
	Address     types_.FlexStrList `json:"address" form:"address" example:"ilike:boulevard" collectionFormat:"multi"`                                                                                                                                            // The place address
	CreatorId   types_.FlexStrList `json:"creator_id" form:"creator_id" example:"in:123456789" collectionFormat:"multi"`                                                                                                                                         // The ID of the place creator
	LocationLat types_.FlexStrList `json:"location_lat" form:"location_lat" example:"gt:3.5" collectionFormat:"multi"`                                                                                                                                           // The latitude of the place
	LocationLng types_.FlexStrList `json:"location_lng" form:"location_lng" example:"lt:4.5" collectionFormat:"multi"`                                                                                                                                           // The longitude of the place
	CreatedAt   types_.FlexStrList `json:"created_at" form:"created_at" example:"gt:2025-09-28" collectionFormat:"multi"`                                                                                                                                        // creation datetime
}

func (ps PlaceSearch) ToSearchQuery() (types_.SearchQuery, error) {
	errorsMap := make(map[string][]string)

	// Helper to collect errors
	addErrors := func(field string, errors []string) {
		if len(errors) > 0 {
			errorsMap[field] = errors
		}
	}

	idFilters, errs := validator_.ToIndexFilters(ps.Id)
	addErrors("id", errs)

	titleFilters, errs := validator_.ToStringFilters(ps.Title, "min=10")
	addErrors("title", errs)

	descriptionFilters, errs := validator_.ToStringFilters(ps.Description, "min=10")
	addErrors("description", errs)

	addressFilters, errs := validator_.ToStringFilters(ps.Address, "min=1")
	addErrors("address", errs)

	creatorFilters, errs := validator_.ToIndexFilters(ps.CreatorId)
	addErrors("creator_id", errs)

	latFilters, errs := validator_.ToFloat64Filters(ps.LocationLat, "")
	addErrors("location_lat", errs)

	lngFilters, errs := validator_.ToFloat64Filters(ps.LocationLng, "")
	addErrors("location_lng", errs)

	createdAtFilters, errs := validator_.ToTimeFilters(ps.CreatedAt, "")
	addErrors("created_at", errs)

	if len(errorsMap) > 0 {
		err := types_.MapToValidationErrs("invalid places filters", errorsMap)
		return types_.SearchQuery{}, err
	}

	return types_.SearchQuery{
		Page:    ps.Page,
		Size:    ps.Size,
		OrderBy: ps.Sort,
		Select:  ps.Fields,
		Where: types_.WhereFilters{
			"id":           idFilters,
			"title":        titleFilters,
			"description":  descriptionFilters,
			"address":      addressFilters,
			"creator_id":   creatorFilters,
			"location_lat": latFilters,
			"location_lng": lngFilters,
			"created_at":   createdAtFilters,
		},
	}, nil
}
