package clients

import (
	"backend/internal/config"
	"backend/internal/lib/types_"
	"context"
	"errors"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"cloud.google.com/go/storage"
	"github.com/google/uuid"
	"google.golang.org/api/option"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type CloudStorage struct {
	projectID          string
	bucketName         string
	urlExpiration      time.Duration
	emulatorPublicURL  string
	emulatorPrivateURL string
	credentialsFile    string
	storageClient      *storage.Client
	bucket             *storage.BucketHandle
	ctx                context.Context
}

func (cs *CloudStorage) IsEmulator() bool {
	return cs.emulatorPrivateURL != "" && cs.emulatorPublicURL != ""
}

func (cs *CloudStorage) getStorageClient() *storage.Client {
	var opts []option.ClientOption

	if cs.IsEmulator() {
		// For emulator, use the custom endpoint without authentication
		opts = append(opts, option.WithEndpoint(cs.emulatorPrivateURL))
		opts = append(opts, option.WithoutAuthentication())
	} else if cs.credentialsFile != "" {
		// Check if credentials file exists
		if _, err := os.Stat(cs.credentialsFile); err != nil {
			panic(fmt.Sprintf("Failed to create a GCS client from credential file %s", cs.credentialsFile))
		}
		opts = append(opts, option.WithCredentialsFile(cs.credentialsFile))
	}

	client, err := storage.NewClient(cs.ctx, opts...)
	if err != nil {
		panic("Failed to create a GCS client")
	}

	return client
}

func (cs *CloudStorage) initEmulator() {
	_, err := cs.bucket.Attrs(cs.ctx)
	if err == nil {
		return
	}

	// Create only if it truly doesn't exist
	if err = cs.bucket.Create(cs.ctx, cs.projectID, &storage.BucketAttrs{}); err != nil {
		if status.Code(err) != codes.AlreadyExists {
			panic(fmt.Sprintf("failed to create bucket: %s", err))
		}
	}

	fmt.Printf("Created bucket %s in emulator\n", cs.bucketName)
}

func (cs *CloudStorage) getEmulatorFileUrl(filename string) string {
	encodedFilename := url.PathEscape(filename)
	return fmt.Sprintf(
		"%s/download/storage/v1/b/%s/o/%s?alt=media",
		cs.emulatorPublicURL, cs.bucketName, encodedFilename,
	)
}

func (cs *CloudStorage) GetSignedUrl(filename string, expiration ...time.Duration) (string, error) {
	if cs.IsEmulator() {
		return cs.getEmulatorFileUrl(filename), nil
	}

	expireDuration := cs.urlExpiration
	if len(expiration) > 0 {
		expireDuration = expiration[0]
	}

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

func (cs *CloudStorage) UploadFile(file any, destination ...string) (string, error) {
	if file == nil {
		return "", nil
	}

	var fileToUpload types_.FileToUpload
	var err error

	switch f := file.(type) {
	case string:
		err = fileToUpload.FromPath(f)
		if err != nil {
			return "", fmt.Errorf("failed to read file from path: %w", err)
		}
	case *types_.FileToUpload:
		fileToUpload = *f
	default:
		return "", fmt.Errorf("unsupported file type %T", file)
	}

	// Generate filename
	var dest string
	if len(destination) > 0 && destination[0] != "" {
		dest = destination[0]
	} else {
		dest = fileToUpload.OriginalName
	}
	ext := filepath.Ext(dest)
	baseFilename := strings.TrimSuffix(filepath.Base(dest), ext)
	filename := fmt.Sprintf("%s_%s%s", baseFilename, uuid.New().String(), ext)
	filename = strings.ToLower(filename)

	// Upload file
	wc := cs.bucket.Object(filename).NewWriter(cs.ctx)
	wc.ContentType = fileToUpload.MimeType

	if _, err := wc.Write(fileToUpload.Buffer); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	if err := wc.Close(); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	return filename, nil
}

func (cs *CloudStorage) DeleteFile(filename string) (bool, error) {
	obj := cs.bucket.Object(filename)
	err := obj.Delete(cs.ctx)
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

func newCloudStorage() *CloudStorage {
	ctx := context.Background()

	cs := &CloudStorage{
		projectID:          config.Env.GCPProjectID,
		bucketName:         config.Env.GCSBucketName,
		urlExpiration:      time.Duration(config.Env.GCSBlobExpiration) * time.Second,
		emulatorPublicURL:  config.Env.GCSEmulatorPub,
		emulatorPrivateURL: config.Env.GCSEmulatorPriv + "/storage/v1/",
		credentialsFile:    config.Env.GoogleCredentials,
		ctx:                ctx,
	}

	// Create storage client
	cs.storageClient = cs.getStorageClient()
	cs.bucket = cs.storageClient.Bucket(cs.bucketName)

	// Initialize emulator if needed
	if cs.IsEmulator() {
		cs.initEmulator()
	}

	return cs
}

// Singleteon pattern

var (
	storageOnce sync.Once
	gcsStorage  *CloudStorage
)

func GetStorage() *CloudStorage {
	storageOnce.Do(func() { gcsStorage = newCloudStorage() })
	return gcsStorage
}
