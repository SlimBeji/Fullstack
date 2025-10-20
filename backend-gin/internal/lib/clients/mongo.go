package clients

import (
	"backend/internal/config"
	"context"
	"fmt"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoClient struct {
	Conn *mongo.Client
	DB   *mongo.Database
}

func (mc *MongoClient) Close() {
	mc.Conn.Disconnect(context.Background())
}

func (mc *MongoClient) CreateCollection(name string) error {
	return mc.DB.CreateCollection(context.Background(), name)
}

func (mc *MongoClient) ListCollections() ([]string, error) {
	return mc.DB.ListCollectionNames(context.Background(), map[string]any{})
}

func (m *MongoClient) DropCollection(name string) error {
	return m.DB.Collection(name).Drop(context.Background())
}

func newMongoClient() *MongoClient {
	uri := config.Env.MongoURL
	dbName := config.Env.MongoDBName
	if testing.Testing() {
		dbName = config.Env.MongoTestDBName
	}

	// Add connection pool options and timeouts for better reliability
	clientOptions := options.Client().ApplyURI(uri)
	clientOptions.SetMaxPoolSize(100)
	clientOptions.SetMinPoolSize(10)
	clientOptions.SetMaxConnIdleTime(30 * time.Second)
	clientOptions.SetServerSelectionTimeout(10 * time.Second)

	// Attempt connection
	conn, err := mongo.Connect(context.Background(), clientOptions)
	if err != nil {
		panic(fmt.Sprintf("Could not establish mongo connection: %s", err.Error()))
	}
	db := conn.Database(dbName)

	return &MongoClient{Conn: conn, DB: db}
}

var mongoClient *MongoClient

func GetMongo() *MongoClient {
	if mongoClient == nil {
		mongoClient = newMongoClient()
	}
	return mongoClient
}
