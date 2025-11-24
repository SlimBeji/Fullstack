package routes

import (
	"backend/internal/api/middlewares"
	"backend/internal/lib/utils"
	"backend/internal/models/collections"
	"backend/internal/models/schemas"
	"backend/internal/types_"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// @Summary      Search and Filter places
// @Tags         Place
// @Accept       application/json
// @Produce      json
// @Security     OAuth2Password[admin]
// @Param        params query schemas.PlaceFilters true "GET parameters"
// @Success      200  {object}  schemas.PlacesPaginated
// @Router       /api/places/ [get]
func getPlaces(c *gin.Context) {
	findQuery, _ := utils.GetBody[types_.FindQuery](c)
	pc := collections.GetPlaceCollection()
	data, err := pc.FetchBsonPage(&findQuery, c)
	if err != nil {
		utils.AbortWithStatusJSON(c, err)
		return
	}
	c.JSON(http.StatusOK, data)
}

// @Summary      Search and Retrieve places
// @Tags         Place
// @Accept       application/json
// @Produce      json
// @Security     OAuth2Password[admin]
// @Param        params body schemas.PlaceFilters true "POST parameters"
// @Success      200  {object}  schemas.PlacesPaginated
// @Router       /api/places/query [post]
func queryPlaces(c *gin.Context) {
	findQuery, _ := utils.GetBody[types_.FindQuery](c)
	fmt.Println(findQuery)
	c.JSON(http.StatusOK, dummyPlace())
}

// @Summary      Place creation
// @Tags         Place
// @Accept       mpfd
// @Produce      json
// @Security     OAuth2Password[admin]
// @Param        params formData schemas.PlacePost true "POST parameters"
// @Param        image  formData file   true "Place Image (JPEG)"
// @Success      200  {object}  schemas.PlaceRead
// @Router       /api/places [post]
func createPlace(c *gin.Context) {
	body, _ := utils.GetBody[schemas.PlacePost](c)
	currentUser := c.MustGet("currentUser").(schemas.UserRead)
	pc := collections.GetPlaceCollection()
	place, err := pc.UserCreate(&currentUser, &body, c)
	if err != nil {
		utils.AbortWithStatusJSON(c, err)
		return
	}
	c.JSON(http.StatusOK, place)
}

// @Summary      Search and Retrieve place by id
// @Tags         Place
// @Accept       application/json
// @Produce      json
// @Security     OAuth2Password[admin]
// @Param        placeId path string true "Place ID"
// @Success      200  {object}  schemas.PlaceRead
// @Router       /api/places/{placeId} [get]
func getPlace(c *gin.Context) {
	pc := collections.GetPlaceCollection()
	placeId := c.Param("placeId")
	place, err := pc.GetById(placeId, c)
	if err != nil {
		utils.AbortWithStatusJSON(c, err)
		return
	}
	c.JSON(http.StatusOK, place)
}

// @Summary      Update places
// @Tags         Place
// @Accept       application/json
// @Produce      json
// @Security     OAuth2Password[admin]
// @Param        placeId path string true "Place ID"
// @Param        params body schemas.PlacePut true "PUT parameters"
// @Success      200  {object}  schemas.PlaceRead
// @Router       /api/places/{placeId} [put]
func updatePlace(c *gin.Context) {
	placeId := c.Param("placeId")
	currentUser := c.MustGet("currentUser").(schemas.UserRead)
	pc := collections.GetPlaceCollection()
	body, _ := utils.GetBody[schemas.PlacePut](c)
	place, err := pc.UserUpdateById(&currentUser, placeId, &body, c)
	if err != nil {
		utils.AbortWithStatusJSON(c, err)
		return
	}
	c.JSON(http.StatusOK, place)
}

type PlaceDeleteResponse struct {
	Message string `json:"message" example:"Deleted place 507f1f77bcf86cd799439011"`
}

// @Summary      Delete place by id
// @Tags         Place
// @Accept       application/json
// @Produce      json
// @Security     OAuth2Password[admin]
// @Param        placeId path string true "Place ID"
// @Success      200  {object}  PlaceDeleteResponse
// @Router       /api/places/{placeId} [delete]
func deletePlace(c *gin.Context) {
	placeId := c.Param("placeId")
	currentUser := c.MustGet("currentUser").(schemas.UserRead)
	pc := collections.GetPlaceCollection()
	err := pc.UserDelete(&currentUser, placeId, c)
	if err != nil {
		utils.AbortWithStatusJSON(c, err)
		return
	}
	message := fmt.Sprintf("Deleted place %s", placeId)
	c.JSON(http.StatusOK, gin.H{"message": message})
}

func RegisterPlaces(r *gin.Engine) {
	router := r.Group("/api/places")
	router.GET(
		"",
		middlewares.Authenticated,
		middlewares.Filter[schemas.PlaceFilters],
		getPlaces,
	)
	router.POST(
		"/query",
		middlewares.Authenticated,
		middlewares.Filter[schemas.PlaceFilters],
		queryPlaces,
	)
	router.POST(
		"",
		middlewares.Authenticated,
		middlewares.BodyValidator[schemas.PlacePost],
		createPlace,
	)
	router.GET("/:placeId", middlewares.Authenticated, getPlace)
	router.PUT(
		"/:placeId",
		middlewares.Authenticated,
		middlewares.BodyValidator[schemas.PlacePut],
		updatePlace,
	)
	router.DELETE("/:placeId", middlewares.Authenticated, deletePlace)
}
