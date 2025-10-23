package types_

import (
	"mime"
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
