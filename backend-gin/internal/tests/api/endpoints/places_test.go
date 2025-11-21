package endpoints

import (
	"backend/internal/api/routes"
	"backend/internal/lib/backendsync"
	"backend/internal/models/collections"
	"backend/internal/models/schemas"
	"backend/internal/types_"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
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
