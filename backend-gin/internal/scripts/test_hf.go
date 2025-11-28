package scripts

import (
	"backend/internal/lib/clients"
	"fmt"
)

func TestHuggingFace() {
	hf := clients.NewHuggingFaceClient()
	vec, err := hf.EmbedText("I am trying to debug my code in go")
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(vec)
	}
}
