package instances

import (
	"backend/internal/config"
	"backend/internal/lib/clients"
	"sync"
	"testing"

	"go.mongodb.org/mongo-driver/mongo"
)

// Mongo

var (
	mongoOnce   sync.Once
	mongoClient *clients.MongoClient
)

func GetMongoDbName() string {
	if testing.Testing() {
		return config.Env.MongoTestDBName
	}
	return config.Env.MongoDBName
}

var mongoConfig = clients.MongoClientConfig{
	Uri:    config.Env.MongoURL,
	DbName: GetMongoDbName(),
}

func GetMongo() *clients.MongoClient {
	mongoOnce.Do(func() {
		mongoClient = clients.NewMongoClient(mongoConfig)
	})
	return mongoClient
}

func GetMongoDB(client *mongo.Client) *mongo.Database {
	dbName := GetMongoDbName()
	return client.Database(dbName)
}

// Redis

var (
	cacheOnce   sync.Once
	redisClient *clients.RedisClient
)

func GetRedisUrl() string {
	if testing.Testing() {
		return config.Env.RedisTestURL
	}
	return config.Env.RedisURL
}

var redisConfig = clients.RedisClientConfig{
	Url:        GetRedisUrl(),
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
