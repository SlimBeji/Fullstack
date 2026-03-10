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

type UserSelectables string

const (
	UserSelectId        UserSelectables = "id"
	UserSelectName      UserSelectables = "name"
	UserSelectEmail     UserSelectables = "email"
	UserSelectIsAdmin   UserSelectables = "isAdmin"
	UserSelectImageURL  UserSelectables = "imageURL"
	UserSelectPlaces    UserSelectables = "places"
	UserSelectCreatedAt UserSelectables = "createdAt"
)

func (field UserSelectables) Validate() bool {
	switch field {
	case UserSelectId, UserSelectName, UserSelectEmail, UserSelectIsAdmin,
		UserSelectImageURL, UserSelectPlaces, UserSelectCreatedAt:
		return true
	default:
		return false
	}
}

type UserSearchables string

const (
	UserSearchId    UserSearchables = "id"
	UserSearchName  UserSearchables = "name"
	UserSearchEmail UserSearchables = "email"
)

func (field UserSearchables) Validate() bool {
	switch field {
	case UserSearchId, UserSearchName, UserSearchEmail:
		return true
	default:
		return false
	}
}

type UserSortables string

const (
	UserSortCreatedAtAsc  UserSortables = "createdAt"
	UserSortCreatedAtDesc UserSortables = "-createdAt"
	UserSortNameAsc       UserSortables = "name"
	UserSortNameDesc      UserSortables = "-name"
	UserSortEmailAsc      UserSortables = "email"
	UserSortEmailDesc     UserSortables = "-email"
)

func (field UserSortables) Validate() bool {
	switch field {
	case UserSortCreatedAtAsc, UserSortCreatedAtDesc,
		UserSortNameAsc, UserSortNameDesc,
		UserSortEmailAsc, UserSortEmailDesc:
		return true
	default:
		return false
	}
}

// --- Fields ----

type UserPlace struct {
	ID      uint   `json:"id" example:"123456789" `                            // The ID of the place
	Title   string `json:"title" validate:"min=10" example:"Stamford Bridge" ` // The place title/name, 10 characters minimum
	Address string `json:"address" validate:"min=1" example:"Fulham road" `    // The place address
}

// --- Base Schemas ----

type UserSeed struct {
	Ref      int
	Name     string
	Email    string
	IsAdmin  bool
	Password string
	ImageURL string
}

// --- Creation Schemas ---

type UserCreate struct {
	Name     string `json:"name" validate:"min=2"`
	Email    string `json:"email" validate:"email"`
	IsAdmin  bool   `json:"isAdmin" `
	Password string `json:"password" validate:"min=8"`
	ImageURL string `json:"imageUrl" validate:"omitempty"`
}

type UserPost struct {
	Name     string                `json:"name" form:"name" validate:"required,min=2" example:"Slim Beji"`                                   // The user name, two characters at least
	Email    string                `json:"email" form:"email" validate:"required,email" example:"mslimbeji@gmail.com"`                       // The user email
	IsAdmin  types_.FlexBool       `json:"isAdmin" form:"isAdmin" validate:"required" example:"false" default:"false" swaggertype:"boolean"` // Whether the user is an admin or not
	Password string                `json:"password" form:"password" validate:"required,min=8" example:"very_secret"`                         // The user password, 8 characters at least
	Image    *multipart.FileHeader `json:"image" form:"image" validate:"omitempty" swaggerignore:"true"`                                     // User's profile image (JPEG)
}

// --- Read Schemas ---

type UserRead struct {
	ID        uint        `json:"id" example:"12345678"`                                                                     // The user ID
	Name      string      `json:"name" validate:"min=2" example:"Slim Beji"`                                                 // The user name, two characters at least
	Email     string      `json:"email" validate:"email" example:"mslimbeji@gmail.com"`                                      // The user email
	IsAdmin   bool        `json:"isAdmin" example:"false" `                                                                  // Whether the user is an admin or not
	ImageURL  string      `json:"imageUrl" validate:"omitempty" example:"avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg" ` // local url on the storage
	Places    []UserPlace `json:"places"`                                                                                    // Places created by the user
	CreatedAt time.Time   `json:"createdAt" example:"2024-01-12T10:15:30.000Z"`                                              // creation datetime                                            // last update datetime
}

type UserGet struct {
	Fields []string `json:"fields" validate:"dive,oneof=id name email isAdmin imageUrl places createdAt" enums:"id,name,email,isAdmin,imageUrl,places,createdAt" example:"id,name"` // Fields to include in the response; omit for full document
}

func (ug UserGet) FromRequest(c *gin.Context) (UserGet, []string) {
	result := UserGet{}
	fieldsRaw, _ := c.GetQuery("fields")
	if fieldsRaw == "" {
		return result, []string{}
	}
	result.Fields = strings.Split(fieldsRaw, ",")
	// No errors to return, field optional
	return result, []string{}
}

// --- Update Schemas ---

type UserUpdate struct {
	Name     *string `json:"name" validate:"omitempty,min=2"`
	Email    *string `json:"email" validate:"omitempty,email"`
	Password *string `json:"password" validate:"omitempty,min=8"`
}

type UserPut struct {
	Name     *string `json:"name" validate:"omitempty,min=2" example:"Slim Beji"`             // The user name, two characters at least
	Email    *string `json:"email" validate:"omitempty,email" example:"mslimbeji@gmail.com" ` // The user email
	Password *string `json:"password" validate:"omitempty,min=8" example:"very_secret" `      // The user password, 8 characters at least
}

// --- Search Schemas ---

type UsersPaginated = types_.PaginatedData[PlaceRead]

type UserSearch struct {
	Page   int                `json:"page" default:"1" validate:"gte=1"`                                                                                                                       // The page number
	Size   int                `json:"size" default:"100" validate:"lte=100,gte=1"`                                                                                                             // Items per page
	Sort   []string           `json:"sort" validate:"dive,oneof=createdAt -createdAt name -name email -email" enums:"createdAt,-createdAt,name,-name,email,-email" example:"-createdAt"`       // Fields to use for sorting. Use the '-' for descending sorting
	Fields []string           `json:"fields" validate:"dive,oneof=id name email isAdmin imageUrl places createdAt" enums:"id,name,email,isAdmin,imageUrl,places,createdAt" example:"id,place"` // Fields to include in the response; omit for full document
	Id     types_.FlexStrList `json:"id" form:"id" example:"123456789" collectionFormat:"multi"`                                                                                               // The user ID
	Name   types_.FlexStrList `json:"name" form:"name" example:"eq:Slim Beji" collectionFormat:"multi"`                                                                                        // The user name, two characters at least
	Email  types_.FlexStrList `json:"email" form:"email" example:"eq:mslimbeji@gmail.com" collectionFormat:"multi"`                                                                            // The user email
}

func (us UserSearch) ToSearchQuery() (types_.SearchQuery, error) {
	errorsMap := make(map[string][]string)

	// Helper to collect errors
	addErrors := func(field string, errors []string) {
		if len(errors) > 0 {
			errorsMap[field] = errors
		}
	}

	idFilters, errs := validator_.ToIndexFilters(us.Id)
	addErrors("id", errs)

	nameFilters, errs := validator_.ToStringFilters(us.Name, "min=2")
	addErrors("name", errs)

	emailFilters, errs := validator_.ToStringFilters(us.Email, "email")
	addErrors("email", errs)

	if len(errorsMap) > 0 {
		err := types_.MapToValidationErrs("invalid users filters", errorsMap)
		return types_.SearchQuery{}, err
	}

	return types_.SearchQuery{
		Page:    us.Page,
		Size:    us.Size,
		OrderBy: us.Sort,
		Select:  us.Fields,
		Where: types_.WhereFilters{
			"id":    idFilters,
			"name":  nameFilters,
			"email": emailFilters,
		},
	}, nil
}
