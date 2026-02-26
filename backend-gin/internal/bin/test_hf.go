package bin

import (
	"backend/internal/services/instances"
	"context"
	"fmt"
)

func TestHuggingFace() {
	hf := instances.GetHfClient()
	ctx := context.Background()
	vec, err := hf.EmbedText(ctx, "I am trying to debug my code in go")
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(vec)
	}
}
