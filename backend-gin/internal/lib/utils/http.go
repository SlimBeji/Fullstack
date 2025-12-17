package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

func PostRequest(
	url string, timeout int, form map[string]any, auth ...string,
) (*http.Response, error) {
	jsonData, err := json.Marshal(form)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request body: %w", err)
	}
	req, err := http.NewRequest("POST", url, bytes.NewReader(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if len(auth) > 0 && auth[0] != "" {
		req.Header.Set("Authorization", "Bearer "+auth[0])
	}

	client := &http.Client{Timeout: time.Duration(timeout) * time.Second}
	return client.Do(req)
}
