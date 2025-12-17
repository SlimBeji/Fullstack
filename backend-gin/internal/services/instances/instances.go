package instances

import (
	"backend/internal/config"
	"backend/internal/lib/clients"
	"sync"
)

// Cloud Storage

var (
	storageOnce sync.Once
	gcsStorage  *clients.CloudStorage
)

var storageConfig = clients.CloudStorageConfig{
	ProjectId:          config.Env.GCPProjectID,
	BucketName:         config.Env.GCSBucketName,
	AccessExpiration:   config.Env.GCSBlobExpiration,
	CredentialsFile:    config.Env.GoogleCredentials,
	EmulatorPublicUrl:  config.Env.GCSEmulatorPub,
	EmulatorPrivateUrl: config.Env.GCSEmulatorPriv,
}

func GetStorage() *clients.CloudStorage {
	storageOnce.Do(func() { gcsStorage = clients.NewCloudStorage(storageConfig) })
	return gcsStorage
}

// HuggingFace

var hfConfig = clients.HuggingFaceClientConfig{
	Token:   config.Env.HFAPIToken,
	Timeout: config.Env.DefaultTimeout,
}

func GetHfClient() clients.HuggingFaceClient {
	return clients.NewHuggingFaceClient(hfConfig)
}
