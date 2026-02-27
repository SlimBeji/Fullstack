package bin

import (
	"backend/internal/services/instances"
	"backend/internal/static"
	"context"
	"fmt"
)

func TestStorage() {
	// Get Storage client
	ctx := context.Background()
	path := static.GetImagePath("avatar1.jpg")
	storage := instances.GetStorage()
	defer storage.Close()

	// Test uploading a file
	destination, err := storage.UploadFile(ctx, path, "")
	if err != nil {
		fmt.Println(err.Error())
	}

	// Test a getting a signed URL
	url, err := storage.GetSignedURL(destination, 3600)
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(url)
	}
}
