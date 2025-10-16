package scripts

import (
	"backend/internal/lib/clients"
	"fmt"
)

func Debug() {
	vector, err := clients.HuggingFace.EmbedText("I love coding")
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(vector)
	}
}
