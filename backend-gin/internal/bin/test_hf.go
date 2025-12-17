package bin

import (
	"backend/internal/services/instances"
	"fmt"
)

func TestHuggingFace() {
	hf := instances.GetHfClient()
	vec, err := hf.EmbedText("I am trying to debug my code in go")
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(vec)
	}
}
