package types_

import (
	"io"
	"mime"
	"mime/multipart"
	"os"
	"path/filepath"
)

type Pagination struct {
	Page int
	Size int
}

func (p *Pagination) Skip() int {
	return (p.Page - 1) * p.Size
}

type RecordsPaginated[T any] struct {
	Page       int `json:"page"`
	TotalPages int `json:"totalPages"`
	TotalCount int `json:"totalCount"`
	Data       []T `json:"data"`
}

type FileToUpload struct {
	OriginalName string
	MimeType     string
	Buffer       []byte
}

func (f *FileToUpload) Size() int {
	return len(f.Buffer)
}

func (f *FileToUpload) FromPath(filePath string) error {
	f.OriginalName = filepath.Base(filePath)

	f.MimeType = mime.TypeByExtension(filepath.Ext(filePath))
	if f.MimeType == "" {
		f.MimeType = "application/octet-stream"
	}

	buffer, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}

	f.Buffer = buffer
	return nil
}

func (f *FileToUpload) FromMultipartHeader(
	fileHeader *multipart.FileHeader,
) error {
	f.OriginalName = fileHeader.Filename

	f.MimeType = mime.TypeByExtension(filepath.Ext(f.OriginalName))
	if f.MimeType == "" {
		f.MimeType = fileHeader.Header.Get("Content-Type")
		if f.MimeType == "" {
			f.MimeType = "application/octet-stream"
		}
	}

	file, err := fileHeader.Open()
	if err != nil {
		return err
	}
	defer file.Close()

	f.Buffer, err = io.ReadAll(file)
	return err
}
