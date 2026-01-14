package endpoints

import (
	"backend/internal/api/routes"
	"backend/internal/lib/types_"
	"backend/internal/models/schemas"
	"backend/internal/services/setup"
	"backend/internal/static"
	"bytes"
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
	setup.SeedTestData()
	token, err := getToken(userEmail)
	if err != nil {
		t.Fatal(err.Error())
	}

	// sending the request
	req := httptest.NewRequest(http.MethodGet, "/api/users/", nil)
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

	var resp types_.PaginatedData[any]
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
	setup.SeedTestData()
	token, err := getToken(userEmail)
	if err != nil {
		t.Fatal(err.Error())
	}

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

	type UserData struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	var resp types_.PaginatedData[UserData]
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
	setup.SeedTestData()
	token, err := getToken(adminEmail)
	if err != nil {
		t.Fatal(err.Error())
	}

	// creating form
	buffer := &bytes.Buffer{}
	writer := multipart.NewWriter(buffer)
	writer.WriteField("name", "Test Van Test")
	writer.WriteField("email", "test@test.com")
	writer.WriteField("password", "very_secret")
	writer.WriteField("isAdmin", "true")

	// attaching file
	file, err := os.Open(static.GetImagePath("avatar1.jpg"))
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
	setup.SeedTestData()
	token, err := getToken(userEmail)
	if err != nil {
		t.Fatal(err.Error())
	}

	// creating form
	buffer := &bytes.Buffer{}
	writer := multipart.NewWriter(buffer)
	writer.WriteField("name", "Test Van Test II")
	writer.WriteField("email", "test_2@test.com")
	writer.WriteField("password", "very_secret")
	writer.WriteField("isAdmin", "true")

	// attaching file
	file, err := os.Open(static.GetImagePath("avatar1.jpg"))
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
	req.Header.Set("Authorization", token.Bearer())
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
	setup.SeedTestData()
	token, err := getToken(userEmail)
	if err != nil {
		t.Fatal(err.Error())
	}

	// sending the request
	url := fmt.Sprintf("/api/users/%s", token.UserId)
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

func TestUpdateUser(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	setup.SeedTestData()
	token, err := getToken(userEmail)
	if err != nil {
		t.Fatal(err.Error())
	}

	// sending the request
	payload := map[string]any{"name": "Slim El Beji"}
	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatal("could not marshal data for TestUpdateUser")
	}
	formReader := bytes.NewReader(body)
	url := fmt.Sprintf("/api/users/%s", token.UserId)
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

	var resp schemas.UserRead
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	if resp.Email != "beji.slim@yahoo.fr" {
		t.Fatalf("expected email to be beji.slim@yahoo.fr, got %s", resp.Email)
	}

	if resp.Name != "Slim El Beji" {
		t.Fatalf("expected name to be Slim El Beji, got %s", resp.Name)
	}
}

func TestUpdateOtherUsers(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	setup.SeedTestData()
	token, err := getToken(userEmail)
	if err != nil {
		t.Fatal(err.Error())
	}
	admin, err := getUser(adminEmail)
	if err != nil {
		t.Fatal(err.Error())
	}

	// sending the request
	payload := map[string]any{"name": "Slim El Beji"}
	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatal("could not marshal data for TestUpdateUser")
	}
	formReader := bytes.NewReader(body)
	url := fmt.Sprintf("/api/users/%s", admin.Id.Hex())
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

func TestDeleteUserAsAdmin(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	setup.SeedTestData()
	token, err := getToken(adminEmail)
	if err != nil {
		t.Fatal(err.Error())
	}

	// sending the request
	url := fmt.Sprintf("/api/users/%s", token.UserId)
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

	expected := fmt.Sprintf("Deleted user %s", token.UserId)
	if resp.Message != expected {
		t.Fatalf("expected %s, got %s", expected, resp.Message)
	}
}

func TestDeleteUserAsNonAdmin(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	setup.SeedTestData()
	token, err := getToken(userEmail)
	if err != nil {
		t.Fatal(err.Error())
	}

	// sending the request
	url := fmt.Sprintf("/api/users/%s", token.UserId)
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
