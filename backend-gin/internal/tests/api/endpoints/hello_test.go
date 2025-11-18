package endpoints

import (
	"backend/internal/api/routes"
	"backend/internal/lib/backendsync"
	"backend/internal/models/collections"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"
)

func TestHelloWorld(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	backendsync.SeedTestData()

	// sending the request
	req := httptest.NewRequest(http.MethodGet, "/api/hello-world", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// checking request response
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	if !strings.Contains(w.Header().Get("Content-Type"), "application/json") {
		t.Fatalf("expected JSON response, got %s", w.Header().Get("Content-Type"))
	}

	var resp map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	expected := map[string]any{"message": "Hello World!"}
	if !reflect.DeepEqual(resp, expected) {
		t.Fatalf("expected %v, got %v", expected, resp)
	}
}

func TestHelloUser(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	backendsync.SeedTestData()
	uc := collections.GetUserCollection()
	token, err := uc.GetBearer("mslimbeji@gmail.com", context.Background())
	if err != nil {
		t.Fatalf("Could not get bearer token for user mslimbeji@gmail.com")
	}

	// sending the request
	req := httptest.NewRequest(http.MethodGet, "/api/hello-world/user", nil)
	req.Header.Set("Authorization", token)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// checking request response
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	if !strings.Contains(w.Header().Get("Content-Type"), "application/json") {
		t.Fatalf("expected JSON response, got %s", w.Header().Get("Content-Type"))
	}

	var resp map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	expected := map[string]any{"message": "Hello Slim Beji!"}
	if !reflect.DeepEqual(resp, expected) {
		t.Fatalf("expected %v, got %v", expected, resp)
	}
}

func TestHelloAdmin(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	backendsync.SeedTestData()
	uc := collections.GetUserCollection()
	token, err := uc.GetBearer("mslimbeji@gmail.com", context.Background())
	if err != nil {
		t.Fatalf("Could not get bearer token for user mslimbeji@gmail.com")
	}

	// sending the request
	req := httptest.NewRequest(http.MethodGet, "/api/hello-world/admin", nil)
	req.Header.Set("Authorization", token)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// checking request response
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	if !strings.Contains(w.Header().Get("Content-Type"), "application/json") {
		t.Fatalf("expected JSON response, got %s", w.Header().Get("Content-Type"))
	}

	var resp map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	expected := map[string]any{"message": "Hello Admin Slim Beji!"}
	if !reflect.DeepEqual(resp, expected) {
		t.Fatalf("expected %v, got %v", expected, resp)
	}
}
