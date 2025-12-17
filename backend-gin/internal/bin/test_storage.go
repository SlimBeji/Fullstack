package bin

import (
	"backend/internal/services/instances"
	"backend/internal/services/setup"
	"backend/internal/static"
	"fmt"
)

func TestStorage() {
	setup := setup.New()
	defer setup.CloseSerives()

	path := static.GetImagePath("avatar1.jpg")
	storage := instances.GetStorage()
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
