package scripts

import (
	"backend/internal/lib/clients"
	"fmt"
)

func Debug() {
	hf := clients.NewHuggingFaceClient()
	vector, err := hf.EmbedText("I love coding")
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(vector)
	}
}
