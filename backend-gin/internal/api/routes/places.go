package routes

import (
	"backend/internal/api/middlewares"
	"backend/internal/lib/gin_"
	"backend/internal/models/cruds"
	"backend/internal/models/schemas"
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
	searchQuery, _ := gin_.GetSearchQuery(c)
	cp := cruds.GetCRUDSPlace()
	data, err := cp.Paginate(searchQuery, &cruds.PlaceOptions{Process: true})
	if err != nil {
		gin_.AbortWithStatusJSON(c, err)
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
// @Router       /api/places/search [post]
func searchPlaces(c *gin.Context) {
	searchQuery, _ := gin_.GetSearchQuery(c)
	cp := cruds.GetCRUDSPlace()
	data, err := cp.Paginate(searchQuery, &cruds.PlaceOptions{Process: true})
	if err != nil {
		gin_.AbortWithStatusJSON(c, err)
		return
	}
	c.JSON(http.StatusOK, data)
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
	currentUser := c.MustGet("currentUser").(schemas.UserRead)
	body, _ := gin_.GetBody[schemas.PlacePost](c)

	cp := cruds.GetCRUDSPlace()
	place, err := cp.UserPost(currentUser, body, &cruds.PlaceOptions{Process: true})
	if err != nil {
		gin_.AbortWithStatusJSON(c, err)
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
	placeId, err := gin_.ExtractId(c, "placeId")
	if err != nil {
		gin_.AbortWithStatusJSON(c, err)
		return
	}

	cp := cruds.GetCRUDSPlace()
	place, err := cp.GetPartial(placeId, &cruds.PlaceOptions{Process: true})
	if err != nil {
		gin_.AbortWithStatusJSON(c, err)
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
	currentUser := c.MustGet("currentUser").(schemas.UserRead)
	body, _ := gin_.GetBody[schemas.PlacePut](c)

	placeId, err := gin_.ExtractId(c, "placeId")
	if err != nil {
		gin_.AbortWithStatusJSON(c, err)
		return
	}

	cp := cruds.GetCRUDSPlace()
	place, err := cp.UserPut(currentUser, placeId, body, &cruds.PlaceOptions{Process: true})
	if err != nil {
		gin_.AbortWithStatusJSON(c, err)
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
	currentUser := c.MustGet("currentUser").(schemas.UserRead)

	placeId, err := gin_.ExtractId(c, "placeId")
	if err != nil {
		gin_.AbortWithStatusJSON(c, err)
		return
	}

	cp := cruds.GetCRUDSPlace()
	err = cp.UserDelete(currentUser, placeId)
	if err != nil {
		gin_.AbortWithStatusJSON(c, err)
		return
	}

	message := fmt.Sprintf("Deleted place %s", placeId)
	c.JSON(http.StatusOK, gin.H{"message": message})
}

func RegisterPlaces(r *gin.Engine) {
	router := r.Group("/api/places")
	router.GET(
		"/",
		middlewares.Authenticated,
		gin_.QueryFilters[schemas.PlaceSearch],
		getPlaces,
	)
	router.POST(
		"/search",
		middlewares.Authenticated,
		gin_.BodyFilters[schemas.PlaceSearch],
		searchPlaces,
	)
	router.POST(
		"",
		middlewares.Authenticated,
		gin_.BodyValidator[schemas.PlacePost],
		createPlace,
	)
	router.GET(
		"/:placeId",
		middlewares.Authenticated,
		gin_.QueryValidator[schemas.PlaceGet],
		getPlace,
	)
	router.PUT(
		"/:placeId",
		middlewares.Authenticated,
		gin_.BodyValidator[schemas.PlacePut],
		updatePlace,
	)
	router.DELETE("/:placeId", middlewares.Authenticated, deletePlace)
}
