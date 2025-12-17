package clients

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoClientConfig struct {
	Uri    string
	DbName string
}

type MongoClient struct {
	config MongoClientConfig
	Conn   *mongo.Client
	DB     *mongo.Database
}

func (mc *MongoClient) Close() {
	mc.Conn.Disconnect(context.Background())
}

func (mc *MongoClient) CreateCollection(name string) error {
	return mc.DB.CreateCollection(context.Background(), name)
}

func (mc *MongoClient) ListCollections() ([]string, error) {
	return mc.DB.ListCollectionNames(context.Background(), bson.D{})
}

func (m *MongoClient) DropCollection(name string) error {
	return m.DB.Collection(name).Drop(context.Background())
}

func createConnection(uri string) (*mongo.Client, error) {
	clientOptions := options.Client().ApplyURI(uri)
	clientOptions.SetMaxPoolSize(100)
	clientOptions.SetMinPoolSize(10)
	clientOptions.SetMaxConnIdleTime(30 * time.Second)
	clientOptions.SetServerSelectionTimeout(10 * time.Second)
	return mongo.Connect(context.Background(), clientOptions)
}

func NewMongoClient(config MongoClientConfig) *MongoClient {
	// Get connection to Database
	conn, err := createConnection(config.Uri)
	if err != nil {
		panic(fmt.Sprintf("Could not establish mongo connection: %s", err.Error()))
	}
	db := conn.Database(config.DbName)
	return &MongoClient{Conn: conn, DB: db, config: config}
}
