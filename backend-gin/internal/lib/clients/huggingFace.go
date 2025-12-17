package clients

import (
	"backend/internal/lib/utils"
	"encoding/json"
	"fmt"
	"net/http"
)

type HuggingFaceClientConfig struct {
	Token      string
	EmbedModel string
	Timeout    int
}

type HuggingFaceClient struct {
	config HuggingFaceClientConfig
}

func (h *HuggingFaceClient) BaseUrl() string {
	return fmt.Sprintf("https://router.huggingface.co/hf-inference/models/%s/pipeline/feature-extraction", h.config.EmbedModel)
}

func (h *HuggingFaceClient) EmbedText(text string) ([]float64, error) {
	requestBody := map[string]any{"inputs": []string{text}}
	url := h.BaseUrl()
	resp, err := utils.PostRequest(
		url, h.config.Timeout, requestBody, h.config.Token,
	)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status: %s", resp.Status)
	}

	var embeddingResponse [][]float64
	if err := json.NewDecoder(resp.Body).Decode(&embeddingResponse); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(embeddingResponse) == 0 || len(embeddingResponse[0]) == 0 {
		return nil, fmt.Errorf("empty embedding response")
	}
	return embeddingResponse[0], nil
}

func NewHuggingFaceClient(config HuggingFaceClientConfig) HuggingFaceClient {
	if config.EmbedModel == "" {
		config.EmbedModel = "sentence-transformers/all-MiniLM-L6-v2"
	}
	return HuggingFaceClient{config: config}
}
