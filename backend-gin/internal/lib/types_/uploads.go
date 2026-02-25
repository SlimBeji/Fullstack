package types_

import (
	"io"
	"mime"
	"mime/multipart"
	"os"
	"path/filepath"
)

type FileToUpload struct {
	OriginalName string
	MimeType     string
	Buffer       []byte
}

func (f *FileToUpload) Size() int {
	return len(f.Buffer)
}

func NewFileFromPath(filePath string) (*FileToUpload, error) {
	buffer, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	mimeType := mime.TypeByExtension(filepath.Ext(filePath))
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	return &FileToUpload{
		OriginalName: filepath.Base(filePath),
		MimeType:     mimeType,
		Buffer:       buffer,
	}, nil
}

func NewFileFromMultipart(fileHeader *multipart.FileHeader) (*FileToUpload, error) {
	file, err := fileHeader.Open()
	if err != nil {
		return nil, err
	}
	defer file.Close()

	buffer, err := io.ReadAll(file)
	if err != nil {
		return nil, err
	}

	mimeType := mime.TypeByExtension(filepath.Ext(fileHeader.Filename))
	if mimeType == "" {
		mimeType = fileHeader.Header.Get("Content-Type")
		if mimeType == "" {
			mimeType = "application/octet-stream"
		}
	}

	return &FileToUpload{
		OriginalName: fileHeader.Filename,
		MimeType:     mimeType,
		Buffer:       buffer,
	}, nil
}
