package endpoints

import (
	"backend/internal/api/routes"
	"backend/internal/lib/setup"
	"backend/internal/static"
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

func TestSignup(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	setup.SeedTestData()

	// creating form
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	writer.WriteField("name", "Didier Drogba")
	writer.WriteField("email", "new_user@gmail.com")
	writer.WriteField("password", "very_secret")

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

	// sending request
	req := httptest.NewRequest(http.MethodPost, "/api/auth/signup", body)
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

	var resp map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	if resp["email"] != "new_user@gmail.com" {
		t.Fatalf("expected email new_user@gmail.com, got %v", resp["email"])
	}

	if _, ok := resp["userId"]; !ok {
		t.Fatalf("missing userId")
	}

	if _, ok := resp["access_token"]; !ok {
		t.Fatalf("missing access_token")
	}
}

func TestSignin(t *testing.T) {
	// setup
	router := routes.SetupRouter()
	setup.SeedTestData()

	// sending the request
	form := "username=mslimbeji@gmail.com&password=very_secret"
	data := strings.NewReader(form)
	req := httptest.NewRequest(http.MethodPost, "/api/auth/signin", data)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
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

	if resp["email"] != "mslimbeji@gmail.com" {
		t.Fatalf("expected email mslimbeji@gmail.com, got %v", resp["email"])
	}

	if _, ok := resp["userId"]; !ok {
		t.Fatalf("missing userId")
	}

	if _, ok := resp["access_token"]; !ok {
		t.Fatalf("missing access_token")
	}
}
