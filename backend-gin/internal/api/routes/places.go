package routes

import (
	"backend/internal/api/middlewares"
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

func createPlace(c *gin.Context) {
	c.JSON(http.StatusOK, dummyPlace())
}

func getPlace(c *gin.Context) {
	placeId := c.Param("placeId")
	fmt.Println(placeId)
	c.JSON(http.StatusOK, dummyPlace())
}

func updatePlace(c *gin.Context) {
	placeId := c.Param("placeId")
	fmt.Println(placeId)
	c.JSON(http.StatusOK, dummyPlace())
}

func deletePlace(c *gin.Context) {
	placeId := c.Param("placeId")
	message := fmt.Sprintf("Deleted place %s", placeId)
	c.JSON(http.StatusOK, gin.H{"message": message})
}

func RegisterPlaces(r *gin.Engine) {
	router := r.Group("/api/places")
	router.POST("", middlewares.Authenticated, createPlace)
	router.GET("/:placeId", middlewares.Authenticated, getPlace)
	router.PUT("/:placeId", middlewares.Authenticated, updatePlace)
	router.DELETE("/:placeId", middlewares.Authenticated, deletePlace)
}
