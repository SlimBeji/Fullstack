package instances

import (
	"backend/internal/config"
	"backend/internal/lib/clients"
	"sync"
)

// Postgresql

var GetPgClient = sync.OnceValue(func() *clients.PgClient {
	config := clients.PgClientConfig{
		URL: config.Env.GetPGURL(),
	}
	return clients.NewPgClient(config)
})

// Redis

var GetRedisClient = sync.OnceValue(func() *clients.RedisClient {
	config := clients.RedisClientConfig{
		URL:        config.Env.GetRedisURL(),
		Expiration: config.Env.RedisExpiration,
	}
	return clients.NewRedisClient(config)
})

// Cloud Storage

var GetStorage = sync.OnceValue(func() *clients.CloudStorage {
	config := clients.CloudStorageConfig{
		ProjectId:          config.Env.GCPProjectID,
		BucketName:         config.Env.GCSBucketName,
		AccessExpiration:   config.Env.GCSBlobExpiration,
		CredentialsFile:    config.Env.GoogleCredentials,
		EmulatorPublicURL:  config.Env.GCSEmulatorPub,
		EmulatorPrivateURL: config.Env.GCSEmulatorPriv,
	}
	return clients.NewCloudStorage(config)
})

// HuggingFace

var hfConfig = clients.HuggingFaceClientConfig{
	Token:   config.Env.HFAPIToken,
	Timeout: config.Env.DefaultTimeout,
}

func GetHfClient() *clients.HuggingFaceClient {
	return clients.NewHuggingFaceClient(hfConfig)
}
