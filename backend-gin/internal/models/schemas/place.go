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
	PlaceSelectImageUrl    PlaceSelectables = "imageUrl"
	PlaceSelectCreatorId   PlaceSelectables = "creatorId"
	PlaceSelectCreatedAt   PlaceSelectables = "createdAt"
)

func (field PlaceSelectables) Validate() bool {
	switch field {
	case PlaceSelectId, PlaceSelectTitle, PlaceSelectDescription, PlaceSelectAddress,
		PlaceSelectLocation, PlaceSelectImageUrl, PlaceSelectCreatorId, PlaceSelectCreatedAt:
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
	PlaceSearchCreatorId   PlaceSearchables = "creatorId"
	PlaceSearchLocationLat PlaceSearchables = "locationLat"
	PlaceSearchLocationLng PlaceSearchables = "locationLng"
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
	PlaceSortCreatedAtAsc    PlaceSortables = "createdAt"
	PlaceSortCreatedAtDesc   PlaceSortables = "-createdAt"
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
	Embedding   []float64
	ImageUrl    string
}

// --- Creation Schemas ---

type PlaceCreate struct {
	Title       string    `json:"title" validate:"min=10"`
	Description string    `json:"description" validate:"min=10" `
	Address     string    `json:"address" validate:"min=1" `
	Location    Location  `json:"location" `
	Embedding   []float64 `json:"embedding" validate:"len=0|len=384" `
	ImageUrl    string    `json:"imageUrl" validate:"omitempty" `
	CreatorID   uint      `json:"creatorId" `
}

type PlacePost struct {
	Title       string                `json:"title" form:"title" validate:"min=10" example:"Stamford Bridge"`                               // The place title/name, 10 characters minimum
	Description string                `json:"description" form:"description" validate:"min=10" example:"Stadium of Chelsea football club" ` // The place description, 10 characters minimum
	Address     string                `json:"address" form:"address" validate:"min=1" example:"Fulham road" `                               // The place address
	Lat         types_.FlexFloat      `json:"lat" form:"lat" example:"51.48180425016331" `                                                  // The latitude of the place
	Lng         types_.FlexFloat      `json:"lng" form:"lng" example:"-0.19090418688755467" `                                               // The longitude of the place
	Image       *multipart.FileHeader `json:"image" form:"image" validate:"omitempty" swaggerignore:"true"`                                 // Place Image (JPEG)
	CreatorID   uint                  `json:"creatorId" form:"creatorId" example:"123456789" `                                              // The ID of the place creator
}

// --- Read Schemas ---

type PlaceRead struct {
	ID          uint      `json:"id" example:"123456789" `                                                                   // The ID of the place
	Title       string    `json:"title" validate:"min=10" example:"Stamford Bridge" `                                        // The place title/name, 10 characters minimum
	Description string    `json:"description" validate:"min=10" example:"Stadium of Chelsea football club" `                 // The place description, 10 characters minimum
	Address     string    `json:"address" validate:"min=1" example:"Fulham road" `                                           // The place address
	Location    Location  `json:"location" `                                                                                 // Location object (can be sent as JSON string)
	ImageUrl    string    `json:"imageUrl" validate:"omitempty" example:"avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg" ` // local url on the storage
	CreatorID   uint      `json:"creatorId" example:"123456789" `                                                            // The ID of the place creator
	CreatedAt   time.Time `json:"createdAt" example:"2024-01-12T10:15:30.000Z"`                                              // creation datetime                                            // last update datetime
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
	Address     *string   `json:"address" validate:"omitempty,min=1" `
	Location    *Location `json:"location" validate:"omitempty" `
}

type PlacePut struct {
	Title       *string       `json:"title" validate:"omitempty,min=10" example:"Stamford Bridge" `                        // The place title/name, 10 characters minimum
	Description *string       `json:"description" validate:"omitempty,min=10" example:"Stadium of Chelsea football club" ` // The place description, 10 characters minimum
	Address     *string       `json:"address" validate:"omitempty,min=1" example:"Fulham road" `                           // The place address
	Location    *FlexLocation `json:"location" validate:"omitempty" `                                                      // Location object (can be sent as JSON string)
}

// --- Search Schemas ---

type PlacesPaginated = types_.PaginatedData[PlaceRead]

type PlaceSearch struct {
	Page        int                `json:"page" default:"1" validate:"gte=1"`                                                                                                   // The page number
	Size        int                `json:"size" default:"100" validate:"lte=100,gte=1"`                                                                                         // Items per page
	Sort        []string           `json:"sort" validate:"dive,oneof=createdAt -createdAt title -title description -description address -address" example:"createdAt"`          // Fields to use for sorting. Use the '-' for descending sorting
	Fields      []string           `json:"fields" validate:"dive,oneof=id title description address location.lat location.lng imageUrl creatorId createdAt" example:"id,title"` // Fields to include in the response; omit for full document
	Id          types_.FlexStrList `json:"id" form:"id" example:"123456789" collectionFormat:"multi"`                                                                           // The ID of the place
	Title       types_.FlexStrList `json:"title" form:"title" example:"eq:Some Place" collectionFormat:"multi"`                                                                 // The place title/name, 10 characters minimum
	Description types_.FlexStrList `json:"description" form:"description" example:"like:football" collectionFormat:"multi"`                                                     // The place description, 10 characters minimum
	Address     types_.FlexStrList `json:"address" form:"address" example:"like:Boulevard" collectionFormat:"multi"`                                                            // The place address
	CreatorId   types_.FlexStrList `json:"creatorId" form:"creatorId" example:"in:123456789" collectionFormat:"multi"`                                                          // The ID of the place creator
	LocationLat types_.FlexStrList `json:"locationLat" form:"locationLat" example:"gt:3.5" collectionFormat:"multi"`                                                            // The latitude of the place
	LocationLng types_.FlexStrList `json:"locationLng" form:"locationLng" example:"lt:4.5" collectionFormat:"multi"`                                                            // The longitude of the place
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
	addErrors("creatorId", errs)

	latFilters, errs := validator_.ToFloat64Filters(ps.LocationLat, "")
	addErrors("locationLat", errs)

	lngFilters, errs := validator_.ToFloat64Filters(ps.LocationLng, "")
	addErrors("locationLng", errs)

	if len(errorsMap) > 0 {
		err := types_.MapToValidationErrs("invalid place filters", errorsMap)
		return types_.SearchQuery{}, err
	}

	return types_.SearchQuery{
		Page:    ps.Page,
		Size:    ps.Size,
		OrderBy: ps.Sort,
		Select:  ps.Fields,
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
