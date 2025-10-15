package routes

import (
	"backend/internal/api/middlewares"
	"backend/internal/lib/utils"
	"backend/internal/models/schemas"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func dummyPlace() schemas.PlaceRead {
	var place schemas.PlaceRead
	place.ID = "683b21134e2e5d46978daf1f"
	place.Title = "Stamford Bridge"
	place.Description = "Stadium of Chelsea football club"
	place.Address = "Fulham road"
	place.Location = schemas.Location{Lat: 51.48180425016331, Lng: -0.19090418688755467}
	place.ImageUrl = "avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg"
	place.CreatorID = "683b21134e2e5d46978daf1f"
	return place
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
	fmt.Println(body)
	c.JSON(http.StatusOK, dummyPlace())
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
	placeId := c.Param("placeId")
	fmt.Println(placeId)
	c.JSON(http.StatusOK, dummyPlace())
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
	body, _ := utils.GetBody[schemas.PlacePut](c)
	fmt.Println(body)
	placeId := c.Param("placeId")
	fmt.Println(placeId)
	c.JSON(http.StatusOK, dummyPlace())
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
	message := fmt.Sprintf("Deleted place %s", placeId)
	c.JSON(http.StatusOK, gin.H{"message": message})
}

func RegisterPlaces(r *gin.Engine) {
	router := r.Group("/api/places")
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
