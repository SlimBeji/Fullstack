package endpoints

import (
	"backend/internal/api/routes"
	"backend/internal/lib/backendsync"
	"backend/internal/lib/encryption"
	"backend/internal/lib/utils"
	"backend/internal/models/collections"
	"backend/internal/models/schemas"
	"backend/internal/types_"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
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
	token, err := encryption.CreateToken(user.Id, user.Email)
	if err != nil {
		t.Fatalf("Could not create token for %s", user.Email)
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

func TestQueryUsers(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	backendsync.SeedTestData()
	uc := collections.GetUserCollection()
	user, err := uc.GetByEmail("beji.slim@yahoo.fr", context.Background())
	if err != nil {
		t.Fatal("Could not extract user beji.slim@yahoo.fr")
	}
	token, err := encryption.CreateToken(user.Id, user.Email)
	if err != nil {
		t.Fatalf("Could not create token for %s", user.Email)
	}
	bearerToken := fmt.Sprintf("Bearer %s", token.AccessToken)

	// sending the request
	payload := map[string]any{
		"email":  []string{"regex:@gmail.com"},
		"fields": []string{"email", "name"},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatal("could not marshal data for TestQueryUsers")
	}
	formReader := bytes.NewReader(body)
	req := httptest.NewRequest(http.MethodPost, "/api/users/query", formReader)
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

	type UserData struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	var resp types_.RecordsPaginated[UserData]
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
		t.Fatalf("expected totalPages to be 1")
	}

	if resp.Data[0].Name != "Slim Beji" {
		t.Fatalf("expected user name to be Slim Beji")
	}

	if resp.Data[0].Email != "mslimbeji@gmail.com" {
		t.Fatalf("expected user email to be mslimbeji@gmail.com")
	}
}

func TestCreateUserAsAdmin(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	backendsync.SeedTestData()
	uc := collections.GetUserCollection()
	user, err := uc.GetByEmail("mslimbeji@gmail.com", context.Background())
	if err != nil {
		t.Fatal("Could not extract user mslimbeji@gmail.com")
	}
	token, err := encryption.CreateToken(user.Id, user.Email)
	if err != nil {
		t.Fatalf("Could not create token for %s", user.Email)
	}
	bearerToken := fmt.Sprintf("Bearer %s", token.AccessToken)

	// creating form
	buffer := &bytes.Buffer{}
	writer := multipart.NewWriter(buffer)
	writer.WriteField("name", "Test Van Test")
	writer.WriteField("email", "test@test.com")
	writer.WriteField("password", "very_secret")
	writer.WriteField("isAdmin", "true")

	// attaching file
	file, err := os.Open(utils.GetImagePath("avatar1.jpg"))
	if err != nil {
		t.Fatalf("failed opening image: %v", err)
	}
	defer file.Close()
	part, _ := writer.CreateFormFile("image", "avatar1.jpg")
	if _, err = io.Copy(part, file); err != nil {
		t.Fatalf("failed attaching file to the form: %v", err)
	}
	writer.Close()

	// sending the request
	req := httptest.NewRequest(http.MethodPost, "/api/users", buffer)
	req.Header.Set("Authorization", bearerToken)
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

	var resp schemas.UserRead
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	if resp.Email != "test@test.com" {
		t.Fatalf("expected email to be test@test.com, got %s", resp.Email)
	}

	if resp.Name != "Test Van Test" {
		t.Fatalf("expected name to be Test Van Test, got %s", resp.Name)
	}

	if resp.IsAdmin != true {
		t.Fatal("expected isAdmin to be true, got false")
	}
}

func TestCreateUserAsNonAdmin(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	backendsync.SeedTestData()
	uc := collections.GetUserCollection()
	user, err := uc.GetByEmail("beji.slim@yahoo.fr", context.Background())
	if err != nil {
		t.Fatal("Could not extract user beji.slim@yahoo.fr")
	}
	token, err := encryption.CreateToken(user.Id, user.Email)
	if err != nil {
		t.Fatalf("Could not create token for %s", user.Email)
	}
	bearerToken := fmt.Sprintf("Bearer %s", token.AccessToken)

	// creating form
	buffer := &bytes.Buffer{}
	writer := multipart.NewWriter(buffer)
	writer.WriteField("name", "Test Van Test II")
	writer.WriteField("email", "test_2@test.com")
	writer.WriteField("password", "very_secret")
	writer.WriteField("isAdmin", "true")

	// attaching file
	file, err := os.Open(utils.GetImagePath("avatar1.jpg"))
	if err != nil {
		t.Fatalf("failed opening image: %v", err)
	}
	defer file.Close()
	part, _ := writer.CreateFormFile("image", "avatar1.jpg")
	if _, err = io.Copy(part, file); err != nil {
		t.Fatalf("failed attaching file to the form: %v", err)
	}
	writer.Close()

	// sending the request
	req := httptest.NewRequest(http.MethodPost, "/api/users", buffer)
	req.Header.Set("Authorization", bearerToken)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// checking request response
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestGetUserById(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	backendsync.SeedTestData()
	uc := collections.GetUserCollection()
	user, err := uc.GetByEmail("beji.slim@yahoo.fr", context.Background())
	if err != nil {
		t.Fatal("Could not extract user beji.slim@yahoo.fr")
	}
	token, err := encryption.CreateToken(user.Id, user.Email)
	if err != nil {
		t.Fatalf("Could not create token for %s", user.Email)
	}
	bearerToken := fmt.Sprintf("Bearer %s", token.AccessToken)

	// sending the request
	url := fmt.Sprintf("/api/users/%s", user.Id)
	req := httptest.NewRequest(http.MethodGet, url, nil)
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

	var resp schemas.UserRead
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	if resp.Email != "beji.slim@yahoo.fr" {
		t.Fatalf("expected email to be beji.slim@yahoo.fr, got %s", resp.Email)
	}

	if resp.Name != "Mohamed Slim Beji" {
		t.Fatalf("expected name to be Mohamed Slim Beji, got %s", resp.Name)
	}
}

func TestDeleteUserAsAdmin(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	backendsync.SeedTestData()
	uc := collections.GetUserCollection()
	user, err := uc.GetByEmail("mslimbeji@gmail.com", context.Background())
	if err != nil {
		t.Fatal("Could not extract user mslimbeji@gmail.com")
	}
	token, err := encryption.CreateToken(user.Id, user.Email)
	if err != nil {
		t.Fatalf("Could not create token for %s", user.Email)
	}
	bearerToken := fmt.Sprintf("Bearer %s", token.AccessToken)

	// sending the request
	url := fmt.Sprintf("/api/users/%s", user.Id)
	req := httptest.NewRequest(http.MethodDelete, url, nil)
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

	var resp routes.UserDeleteResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	expected := fmt.Sprintf("Deleted user %s", user.Id)
	if resp.Message != expected {
		t.Fatalf("expected %s, got %s", expected, resp.Message)
	}
}

func TestDeleteUserAsNonAdmin(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	backendsync.SeedTestData()
	uc := collections.GetUserCollection()
	user, err := uc.GetByEmail("beji.slim@yahoo.fr", context.Background())
	if err != nil {
		t.Fatal("Could not extract user beji.slim@yahoo.fr")
	}
	token, err := encryption.CreateToken(user.Id, user.Email)
	if err != nil {
		t.Fatalf("Could not create token for %s", user.Email)
	}
	bearerToken := fmt.Sprintf("Bearer %s", token.AccessToken)

	// sending the request
	url := fmt.Sprintf("/api/users/%s", user.Id)
	req := httptest.NewRequest(http.MethodDelete, url, nil)
	req.Header.Set("Authorization", bearerToken)
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
