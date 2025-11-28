package clients

import (
	"backend/internal/config"
	"backend/internal/lib/utils"
	"encoding/json"
	"fmt"
	"net/http"
)

type HuggingFaceClient struct {
	token      string
	embedModel string
	baseURL    string
}

func (h *HuggingFaceClient) EmbedText(text string) ([]float64, error) {
	requestBody := map[string]any{"inputs": []string{text}}
	resp, err := utils.PostRequest(h.baseURL, requestBody, h.token)
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

func NewHuggingFaceClient(embedModel ...string) *HuggingFaceClient {
	model := "sentence-transformers/all-MiniLM-L6-v2"
	if len(embedModel) > 0 && embedModel[0] != "" {
		model = embedModel[0]
	}

	return &HuggingFaceClient{
		token:      config.Env.HFAPIToken,
		embedModel: model,
		baseURL:    fmt.Sprintf("https://router.huggingface.co/hf-inference/models/%s/pipeline/feature-extraction", model),
	}
}
