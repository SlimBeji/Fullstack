package endpoints

import (
	"backend/internal/api/routes"
	"backend/internal/lib/backendsync"
	"backend/internal/lib/utils"
	"backend/internal/models/collections"
	"backend/internal/models/schemas"
	"backend/internal/types_"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

func getPlaceExamples() ([]schemas.PlaceRead, error) {
	pc := collections.GetPlaceCollection()
	findQuery := types_.FindQuery{
		Filters: types_.FindQueryFilters{
			"title": {{Op: "eq", Val: "Stamford Bridge"}},
		},
	}
	data, err := pc.FetchPage(&findQuery, context.Background())
	if err != nil {
		return []schemas.PlaceRead{}, errors.New(
			"could not extract examples for testing places endpoints",
		)
	}
	return data.Data, nil
}

func TestGetPlaces(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	backendsync.SeedTestData()
	token, err := getToken(userEmail)
	if err != nil {
		t.Fatal(err.Error())
	}

	// sending the request
	url := "/api/places?title=eq:Stamford%20Bridge"
	req := httptest.NewRequest(http.MethodGet, url, nil)
	req.Header.Set("Authorization", token.Bearer())
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// checking request response
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	if !strings.Contains(w.Header().Get("Content-Type"), "application/json") {
		t.Fatalf("expected JSON response, got %s", w.Header().Get("Content-Type"))
	}

	var resp types_.RecordsPaginated[any]
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	if resp.Page != 1 {
		t.Fatalf("expected to get only one page")
	}

	if resp.TotalPages != 1 {
		t.Fatalf("expected totalPages to be 1")
	}

	if resp.TotalCount != 1 {
		t.Fatalf("expected totalPages to be 2")
	}

	if len(resp.Data) == 0 {
		t.Fatalf("missing data")
	}
}

func TestCreatePlace(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	backendsync.SeedTestData()
	token, err := getToken(userEmail)
	if err != nil {
		t.Fatal(err.Error())
	}

	// creating form
	buffer := &bytes.Buffer{}
	writer := multipart.NewWriter(buffer)
	writer.WriteField("creatorId", token.UserId)
	writer.WriteField("description", "A brand new place")
	writer.WriteField("title", "Brand New Place")
	writer.WriteField("address", "Somewhere over the rainbow")
	writer.WriteField("lat", "1.0")
	writer.WriteField("lng", "2.0")

	// attaching file
	file, err := os.Open(utils.GetImagePath("place1.jpg"))
	if err != nil {
		t.Fatalf("failed opening image: %v", err)
	}
	defer file.Close()
	part, _ := writer.CreateFormFile("image", "place1.jpg")
	if _, err = io.Copy(part, file); err != nil {
		t.Fatalf("failed attaching file to the form: %v", err)
	}
	writer.Close()

	// sending the request
	req := httptest.NewRequest(http.MethodPost, "/api/places", buffer)
	req.Header.Set("Authorization", token.Bearer())
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// checking request response
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	if !strings.Contains(w.Header().Get("Content-Type"), "application/json") {
		t.Fatalf("expected JSON response, got %s", w.Header().Get("Content-Type"))
	}

	var resp schemas.PlaceRead
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	if resp.CreatorID != token.UserId {
		t.Fatalf(
			"expected creatorId to be %s, got %s", token.UserId, resp.CreatorID,
		)
	}

	if resp.Description != "A brand new place" {
		t.Fatalf(
			"expected description to be %s, got %s", "A brand new place", resp.Description,
		)
	}

	if resp.Title != "Brand New Place" {
		t.Fatalf(
			"expected title to be %s, got %s", "Brand New Place", resp.Title,
		)
	}

	if resp.Address != "Somewhere over the rainbow" {
		t.Fatalf(
			"expected addres to be %s, got %s", "Somewhere over the rainbow", resp.Address,
		)
	}
}

func TestCreatePlaceForOthers(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	backendsync.SeedTestData()
	token, err := getToken(userEmail)
	if err != nil {
		t.Fatal(err.Error())
	}
	admin, err := getUser("mslimbeji@gmail.com")
	if err != nil {
		t.Fatal(err.Error())
	}

	// creating form
	buffer := &bytes.Buffer{}
	writer := multipart.NewWriter(buffer)
	writer.WriteField("creatorId", admin.Id)
	writer.WriteField("description", "A brand new place")
	writer.WriteField("title", "Brand New Place")
	writer.WriteField("address", "Somewhere over the rainbow")
	writer.WriteField("lat", "1.0")
	writer.WriteField("lng", "2.0")

	// attaching file
	file, err := os.Open(utils.GetImagePath("place1.jpg"))
	if err != nil {
		t.Fatalf("failed opening image: %v", err)
	}
	defer file.Close()
	part, _ := writer.CreateFormFile("image", "place1.jpg")
	if _, err = io.Copy(part, file); err != nil {
		t.Fatalf("failed attaching file to the form: %v", err)
	}
	writer.Close()

	// sending the request
	req := httptest.NewRequest(http.MethodPost, "/api/places", buffer)
	req.Header.Set("Authorization", token.Bearer())
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// checking request response
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}

	if !strings.Contains(w.Header().Get("Content-Type"), "application/json") {
		t.Fatalf("expected JSON response, got %s", w.Header().Get("Content-Type"))
	}
}

func TestGetPlaceById(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	backendsync.SeedTestData()
	token, err := getToken(userEmail)
	if err != nil {
		t.Fatal(err.Error())
	}
	examples, err := getPlaceExamples()
	if err != nil {
		t.Fatal(err.Error())
	}

	// sending the request
	url := fmt.Sprintf("/api/places/%s", examples[0].ID)
	req := httptest.NewRequest(http.MethodGet, url, nil)
	req.Header.Set("Authorization", token.Bearer())
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// checking request response
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	if !strings.Contains(w.Header().Get("Content-Type"), "application/json") {
		t.Fatalf("expected JSON response, got %s", w.Header().Get("Content-Type"))
	}

	var resp schemas.PlaceRead
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	if resp.Address != "Fulham Road, London" {
		t.Fatalf("expected email to be Fulham Road, London, got %s", resp.Address)
	}

	if resp.Title != "Stamford Bridge" {
		t.Fatalf("expected name to be Stamford Bridge, got %s", resp.Title)
	}

	if resp.Description != "Chelsea FC Stadium" {
		t.Fatalf("expected name to be Chelsea FC Stadium, got %s", resp.Description)
	}
}

func TestUpdatePlaceById(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	backendsync.SeedTestData()
	token, err := getToken(adminEmail)
	if err != nil {
		t.Fatal(err.Error())
	}
	examples, err := getPlaceExamples()
	if err != nil {
		t.Fatal(err.Error())
	}

	// sending the request
	payload := map[string]any{
		"description": "Stamford Bridge - Home of the Blues",
	}
	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatal("could not marshal data for TestUpdatePlaceById")
	}
	formReader := bytes.NewReader(body)
	url := fmt.Sprintf("/api/places/%s", examples[0].ID)
	req := httptest.NewRequest(http.MethodPut, url, formReader)
	req.Header.Set("Authorization", token.Bearer())
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// checking request response
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	if !strings.Contains(w.Header().Get("Content-Type"), "application/json") {
		t.Fatalf("expected JSON response, got %s", w.Header().Get("Content-Type"))
	}

	var resp schemas.PlaceRead
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	if resp.Address != "Fulham Road, London" {
		t.Fatalf("expected email to be Fulham Road, London, got %s", resp.Address)
	}

	if resp.Title != "Stamford Bridge" {
		t.Fatalf("expected name to be Stamford Bridge, got %s", resp.Title)
	}

	if resp.Description != "Stamford Bridge - Home of the Blues" {
		t.Fatalf("expected name to be Stamford Bridge - Home of the Blues, got %s", resp.Description)
	}
}

func TestUpdatePlaceForOthers(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	backendsync.SeedTestData()
	token, err := getToken(userEmail)
	if err != nil {
		t.Fatal(err.Error())
	}
	examples, err := getPlaceExamples()
	if err != nil {
		t.Fatal(err.Error())
	}

	// sending the request
	payload := map[string]any{
		"description": "Stamford Bridge - Home of the Blues",
	}
	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatal("could not marshal data for TestUpdatePlaceById")
	}
	formReader := bytes.NewReader(body)
	url := fmt.Sprintf("/api/places/%s", examples[0].ID)
	req := httptest.NewRequest(http.MethodPut, url, formReader)
	req.Header.Set("Authorization", token.Bearer())
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// checking request response
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}

	if !strings.Contains(w.Header().Get("Content-Type"), "application/json") {
		t.Fatalf("expected JSON response, got %s", w.Header().Get("Content-Type"))
	}
}

func TestDeletePlaceForOthers(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	backendsync.SeedTestData()
	token, err := getToken(userEmail)
	if err != nil {
		t.Fatal(err.Error())
	}
	examples, err := getPlaceExamples()
	if err != nil {
		t.Fatal(err.Error())
	}

	// sending the request
	url := fmt.Sprintf("/api/places/%s", examples[0].ID)
	req := httptest.NewRequest(http.MethodDelete, url, nil)
	req.Header.Set("Authorization", token.Bearer())
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// checking request response
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}

	if !strings.Contains(w.Header().Get("Content-Type"), "application/json") {
		t.Fatalf("expected JSON response, got %s", w.Header().Get("Content-Type"))
	}
}

func TestDeletePlace(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	backendsync.SeedTestData()
	token, err := getToken(adminEmail)
	if err != nil {
		t.Fatal(err.Error())
	}
	examples, err := getPlaceExamples()
	if err != nil {
		t.Fatal(err.Error())
	}

	// sending the request
	url := fmt.Sprintf("/api/places/%s", examples[0].ID)
	req := httptest.NewRequest(http.MethodDelete, url, nil)
	req.Header.Set("Authorization", token.Bearer())
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// checking request response
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	if !strings.Contains(w.Header().Get("Content-Type"), "application/json") {
		t.Fatalf("expected JSON response, got %s", w.Header().Get("Content-Type"))
	}

	var resp routes.UserDeleteResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	expected := fmt.Sprintf("Deleted place %s", examples[0].ID)
	if resp.Message != expected {
		t.Fatalf("expected %s, got %s", expected, resp.Message)
	}
}
