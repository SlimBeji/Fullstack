package scripts

import (
	"backend/internal/lib/clients"
	"backend/internal/lib/utils"
	"fmt"
)

func TestStorage() {
	path := utils.GetImagePath("avatar1.jpg")
	destination, err := clients.Storage.UploadFile(path)
	if err != nil {
		fmt.Println(err.Error())
	}

	url, err := clients.Storage.GetSignedUrl(destination)
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(url)
	}
}
