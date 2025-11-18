package endpoints

import (
	"backend/internal/api/routes"
	"backend/internal/lib/backendsync"
	"backend/internal/lib/encryption"
	"backend/internal/models/collections"
	"backend/internal/types_"
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
	bearerToken := fmt.Sprintf("Bearer %s", token.AccessToken)

	// sending the request
	req := httptest.NewRequest(http.MethodGet, "/api/users", nil)
	req.Header.Set("Authorization", bearerToken)
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

	if resp.TotalCount != 2 {
		t.Fatalf("expected totalPages to be 2")
	}

	if len(resp.Data) == 0 {
		t.Fatalf("missing data")
	}
}
