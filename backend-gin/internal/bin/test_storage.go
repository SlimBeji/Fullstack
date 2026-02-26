package bin

import (
	"backend/internal/services/instances"
	"backend/internal/services/setup"
	"backend/internal/static"
	"context"
	"fmt"
)

func TestStorage() {
	setup := setup.New()
	defer setup.CloseSerivces()

	ctx := context.Background()
	path := static.GetImagePath("avatar1.jpg")
	storage := instances.GetStorage()
	defer storage.Close()
	destination, err := storage.UploadFile(ctx, path, "")
	if err != nil {
		fmt.Println(err.Error())
	}

	url, err := storage.GetSignedURL(destination, 3600)
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(url)
	}
}
