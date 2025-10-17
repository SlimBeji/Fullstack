package scripts

import (
	"backend/internal/lib/clients"
	"backend/internal/lib/utils"
	"fmt"
)

func TestStorage() {
	path := utils.GetImagePath("avatar1.jpg")
	storage := clients.GetStorage()
	defer storage.Close()
	destination, err := storage.UploadFile(path)
	if err != nil {
		fmt.Println(err.Error())
	}

	url, err := storage.GetSignedUrl(destination)
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(url)
	}
}
