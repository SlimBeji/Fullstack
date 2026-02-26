package clients

import (
	"backend/internal/lib/types_"
	"context"
	"errors"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"cloud.google.com/go/storage"
	"github.com/google/uuid"
	"google.golang.org/api/option"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type CloudStorageConfig struct {
	ProjectId          string
	BucketName         string
	AccessExpiration   int
	CredentialsFile    string
	EmulatorPublicURL  string
	EmulatorPrivateURL string
}

type CloudStorage struct {
	config        CloudStorageConfig
	storageClient *storage.Client
	bucket        *storage.BucketHandle
}

func (cs *CloudStorage) emulatorPrivateURL() string {
	if strings.HasSuffix(cs.config.EmulatorPrivateURL, "/storage/v1/") {
		return cs.config.EmulatorPrivateURL
	}
	return cs.config.EmulatorPrivateURL + "/storage/v1/"
}

func (cs *CloudStorage) isEmulator() bool {
	return cs.config.EmulatorPrivateURL != "" && cs.config.EmulatorPublicURL != ""
}

func (cs *CloudStorage) getStorageClient(ctx context.Context) *storage.Client {
	var opts []option.ClientOption

	if cs.isEmulator() {
		// For emulator, use the custom endpoint without authentication
		opts = append(opts, option.WithEndpoint(cs.emulatorPrivateURL()))
		opts = append(opts, option.WithoutAuthentication())
	} else if cs.config.CredentialsFile != "" {
		// Check if credentials file exists
		if _, err := os.Stat(cs.config.CredentialsFile); err != nil {
			panic(fmt.Sprintf("Failed to create a GCS client from credential file %s", cs.config.CredentialsFile))
		}
		opts = append(opts, option.WithCredentialsFile(cs.config.CredentialsFile))
	}

	client, err := storage.NewClient(ctx, opts...)
	if err != nil {
		panic("Failed to create a GCS client")
	}

	return client
}

func (cs *CloudStorage) initEmulator(ctx context.Context) {
	_, err := cs.bucket.Attrs(ctx)
	if err == nil {
		return
	}

	// Create only if it truly doesn't exist
	if err = cs.bucket.Create(
		ctx, cs.config.ProjectId,
		&storage.BucketAttrs{Name: cs.config.BucketName},
	); err != nil {
		if status.Code(err) != codes.AlreadyExists {
			panic(fmt.Sprintf("failed to create bucket: %s", err))
		}
	}

	fmt.Printf("Created bucket %s in emulator\n", cs.config.BucketName)
}

func (cs *CloudStorage) getEmulatorFileURL(filename string) string {
	encodedFilename := url.PathEscape(filename)
	return fmt.Sprintf(
		"%s/download/storage/v1/b/%s/o/%s?alt=media",
		cs.emulatorPrivateURL(), cs.config.BucketName, encodedFilename,
	)
}

func (cs *CloudStorage) GetSignedURL(
	filename string, expiration int,
) (string, error) {
	if cs.isEmulator() {
		return cs.getEmulatorFileURL(filename), nil
	}

	if expiration <= 0 {
		expiration = cs.config.AccessExpiration
	}
	expireDuration := time.Duration(expiration) * time.Second
	opts := &storage.SignedURLOptions{
		Scheme:  storage.SigningSchemeV4,
		Method:  "GET",
		Expires: time.Now().Add(expireDuration),
	}

	url, err := cs.bucket.SignedURL(filename, opts)
	if err != nil {
		return "", fmt.Errorf("failed to generate signed URL: %w", err)
	}

	return url, nil
}

func (cs *CloudStorage) UploadFile(
	ctx context.Context, file any, destination string,
) (string, error) {
	if file == nil {
		return "", nil
	}

	var fileToUpload *types_.FileToUpload
	var err error

	switch f := file.(type) {
	case string:
		fileToUpload, err = types_.NewFileFromPath(f)
		if err != nil {
			return "", fmt.Errorf("failed to read file from path: %w", err)
		}
	case *types_.FileToUpload:
		fileToUpload = f
	case types_.FileToUpload:
		fileToUpload = &f
	default:
		return "", fmt.Errorf("unsupported file type %T", file)
	}

	// Handle filename
	if destination == "" {
		destination = fileToUpload.OriginalName
	}
	ext := filepath.Ext(destination)
	baseFilename := strings.TrimSuffix(filepath.Base(destination), ext)
	filename := fmt.Sprintf("%s_%s%s", baseFilename, uuid.New().String(), ext)
	filename = strings.ToLower(filename)

	// Upload file
	wc := cs.bucket.Object(filename).NewWriter(ctx)
	wc.ContentType = fileToUpload.MimeType

	if _, err := wc.Write(fileToUpload.Buffer); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	if err := wc.Close(); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	return filename, nil
}

func (cs *CloudStorage) DeleteFile(
	ctx context.Context, filename string,
) (bool, error) {
	obj := cs.bucket.Object(filename)
	err := obj.Delete(ctx)
	if err != nil {
		if errors.Is(err, storage.ErrObjectNotExist) {
			return false, nil
		}
		return false, fmt.Errorf("failed to delete file: %w", err)
	}
	return true, nil
}

func (cs *CloudStorage) Close() error {
	if cs.storageClient != nil {
		return cs.storageClient.Close()
	}
	return nil
}

func NewCloudStorage(config CloudStorageConfig) *CloudStorage {
	if config.BucketName == "" {
		panic("bucket name is required")
	}

	cs := &CloudStorage{config: config}
	if !cs.isEmulator() && config.CredentialsFile == "" {
		panic("credentials file required for non-emulator mode")
	}

	// Create storage client
	ctx := context.Background()
	cs.storageClient = cs.getStorageClient(ctx)
	cs.bucket = cs.storageClient.Bucket(cs.config.BucketName)

	// Initialize emulator if needed
	if cs.isEmulator() {
		cs.initEmulator(ctx)
	}

	return cs
}
