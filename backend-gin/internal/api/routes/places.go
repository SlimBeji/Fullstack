package routes

import (
	"backend/internal/api/middlewares"
	"backend/internal/models/schemas"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

var place, _ = schemas.BuildStruct[schemas.Place](map[string]any{
	"id":          "683b21134e2e5d46978daf1f",
	"title":       "Stamford Bridge",
	"description": "Stadium of Chelsea football club",
	"address":     "Fulham road",
	"location":    map[string]float64{"lat": 51.48180425016331, "lng": -0.19090418688755467},
	"imageUrl":    "avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg",
	"creatorId":   "683b21134e2e5d46978daf1f",
})

func createPlace(c *gin.Context) {
	c.JSON(http.StatusOK, place)
}

func getPlace(c *gin.Context) {
	placeId := c.Param("placeId")
	fmt.Println(placeId)
	c.JSON(http.StatusOK, place)
}

func updatePlace(c *gin.Context) {
	placeId := c.Param("placeId")
	fmt.Println(placeId)
	c.JSON(http.StatusOK, place)
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
