package schemas

import (
	"backend/internal/lib/types_"
	"mime/multipart"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// --- Base Schemas ----

type UserDB struct {
	Id        primitive.ObjectID `bson:"_id,omitempty"`
	Name      string             `bson:"name"`
	Email     string             `bson:"email"`
	IsAdmin   types_.FlexBool    `bson:"isAdmin"`
	Password  string             `bson:"password"`
	ImageUrl  string             `bson:"imageUrl"`
	Places    []string           `bson:"places"`
	CreatedAt time.Time          `bson:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt"`
}

type UserSeed struct {
	Ref      int
	Name     string
	Email    string
	IsAdmin  types_.FlexBool
	Password string
	ImageUrl string
}

// --- Creation Schemas ---

type UserCreate struct {
	Name     string          `json:"name" validate:"min=2"`
	Email    string          `json:"email" validate:"email"`
	IsAdmin  types_.FlexBool `json:"isAdmin" `
	Password string          `json:"password" validate:"min=10"`
	ImageUrl string          `json:"imageUrl" validate:"omitempty"`
}

type UserPost struct {
	Name     string                `json:"name" form:"name" validate:"min=2" example:"Slim Beji"`             // The user name, two characters at least
	Email    string                `json:"email" form:"email" validate:"email" example:"mslimbeji@gmail.com"` // The user email
	IsAdmin  types_.FlexBool       `json:"isAdmin" form:"isAdmin" example:"false"`                            // Whether the user is an admin or not
	Password string                `json:"password" form:"password" validate:"min=10" example:"very_secret"`  // The user password, 10 characters at least
	Image    *multipart.FileHeader `json:"image" form:"image" validate:"omitempty" swaggerignore:"true"`      // User's profile image (JPEG)
}

// --- Read Schemas ---

type UserRead struct {
	Id        primitive.ObjectID   `json:"id" validate:"hexadecimal,len=24" example:"683b21134e2e5d46978daf1f"`                       // The user ID, 24 characters
	Name      string               `json:"name" validate:"min=2" example:"Slim Beji"`                                                 // The user name, two characters at least
	Email     string               `json:"email" validate:"email" example:"mslimbeji@gmail.com"`                                      // The user email
	IsAdmin   types_.FlexBool      `json:"isAdmin" example:"false" `                                                                  // Whether the user is an admin or not
	ImageUrl  string               `json:"imageUrl" validate:"omitempty" example:"avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg" ` // local url on the storage
	Places    []primitive.ObjectID `json:"places" validate:"dive,hexadecimal,len=24" example:"683b21134e2e5d46978daf1f"`              // The id of places belonging to the user, 24 characters
	CreatedAt time.Time            `json:"createdAt" example:"2024-01-12T10:15:30.000Z"`                                              // creation datetime
	UpdatedAt time.Time            `json:"updatedAt" example:"2024-01-12T10:15:30.000Z"`                                              // last update datetime
}

// --- Update Schemas ---

type UserUpdate struct {
	Name     *string `json:"name" validate:"omitempty,min=2"`
	Email    *string `json:"email" validate:"omitempty,email"`
	Password *string `json:"password" validate:"omitempty,min=10"`
}

type UserPut struct {
	Name     *string `json:"name" validate:"omitempty,min=2" example:"Slim Beji"`             // The user name, two characters at least
	Email    *string `json:"email" validate:"omitempty,email" example:"mslimbeji@gmail.com" ` // The user email
	Password *string `json:"password" validate:"omitempty,min=10" example:"very_secret" `     // The user password, 10 characters at least
}

// --- Search Schemas ---

type UsersPaginated = types_.PaginatedData[PlaceRead]

type UserFilters struct {
	Page   int      `json:"page" default:"1" validate:"gte=1"`                                                                           // The page number
	Size   int      `json:"size" default:"100" validate:"lte=100,gte=1"`                                                                 // Items per page
	Sort   []string `json:"sort" validate:"dive,oneof=createdAt -createdAt name -name email -email" example:"createdAt"`                 // Fields to use for sorting. Use the '-' for descending sorting
	Fields []string `json:"fields" validate:"dive,oneof=id name email isAdmin imageUrl places createdAt" example:"id,name"`              // Fields to include in the response; omit for full document
	Id     []string `json:"id" form:"id" filter:"string,hexadecimal,len=24" example:"683b21134e2e5d46978daf1f" collectionFormat:"multi"` // The user ID, 24 characters
	Name   []string `json:"name" form:"name" filter:"string,min=2" example:"eq:Slim Beji" collectionFormat:"multi"`                      // The user name, two characters at least
	Email  []string `json:"email" form:"email" filter:"string,email" example:"eq:mslimbeji@gmail.com" collectionFormat:"multi"`          // The user email
}

func (uf UserFilters) ToSearchQuery() types_.SearchQuery {
	return types_.SearchQuery{
		Page:    uf.Page,
		Size:    uf.Size,
		OrderBy: uf.Sort,
		Select:  uf.Fields,
		Where:   types_.WhereFilters{
			//Parse these from []string to []Filter
			// "Id":    pf.Id,
			// "Name":  pf.Name,
			// "Email": pf.Email,
		},
	}
}
