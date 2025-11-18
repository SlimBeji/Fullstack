package endpoints

import (
	"backend/internal/api/routes"
	"backend/internal/lib/backendsync"
	"backend/internal/lib/encryption"
	"backend/internal/models/collections"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestFetchUsers(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	backendsync.SeedTestData()
	uc := collections.GetUserCollection()
	user, err := uc.GetByEmail("beji.slim@yahoo.fr", context.Background())
	if err != nil {
		t.Fatal("Could not extract user beji.slim@yahoo.fr")
	}
	token, err := encryption.CreateToken(user.Id, "beji.slim@yahoo.fr")
	if err != nil {
		t.Fatal("Could not create token for beji.slim@yahoo.fr")
	}
	access_token := fmt.Sprintf("Bearer %s", token.AccessToken)

	// sending the request
	req := httptest.NewRequest(http.MethodGet, "/api/users", nil)
	req.Header.Set("Authorization", access_token)
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

	if _, ok := resp["page"]; !ok {
		t.Fatalf("%s", resp)
		t.Fatalf("missing page")
	}

	if _, ok := resp["totalPages"]; !ok {
		t.Fatalf("missing totalPages")
	}

	if _, ok := resp["totalCount"]; !ok {
		t.Fatalf("missing totalCount")
	}

	if _, ok := resp["data"]; !ok {
		t.Fatalf("missing data")
	}
}
