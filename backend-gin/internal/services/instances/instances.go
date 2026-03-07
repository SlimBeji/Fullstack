package instances

import (
	"backend/internal/config"
	"backend/internal/lib/clients"
	"sync"
)

// Postgresql

var (
	pgOnce   sync.Once
	pgClient *clients.PgClient
)

var pgConfig = clients.PgClientConfig{
	URL: config.Env.GetPGURL(),
}

func GetPgClient() *clients.PgClient {
	pgOnce.Do(func() { pgClient = clients.NewPgClient(pgConfig) })
	return pgClient
}

// Redis

var (
	cacheOnce   sync.Once
	redisClient *clients.RedisClient
)

var redisConfig = clients.RedisClientConfig{
	URL:        config.Env.GetRedisURL(),
	Expiration: config.Env.RedisExpiration,
}

func GetRedisClient() *clients.RedisClient {
	cacheOnce.Do(func() { redisClient = clients.NewRedisClient(redisConfig) })
	return redisClient
}

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
	EmulatorPublicURL:  config.Env.GCSEmulatorPub,
	EmulatorPrivateURL: config.Env.GCSEmulatorPriv,
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

func GetHfClient() *clients.HuggingFaceClient {
	return clients.NewHuggingFaceClient(hfConfig)
}
