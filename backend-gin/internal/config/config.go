package config

import (
	"log"

	"github.com/kelseyhightower/envconfig"
)

type Settings struct {
	// ENV config
	Port              int    `envconfig:"PORT" default:"5002"`
	APIURL            string `envconfig:"API_URL" default:"http://localhost:5002/api"`
	AppURL            string `envconfig:"APP_URL" required:"true"`
	SecretKey         string `envconfig:"SECRET_KEY" required:"true"`
	FileUploadMaxSize int    `envconfig:"FILEUPLOAD_MAX_SIZE" default:"100"`
	JSONMaxSize       int    `envconfig:"JSON_MAX_SIZE" default:"10240"`
	MaxItemsPerPage   int    `envconfig:"MAX_ITEMS_PER_PAGE" default:"100"`
	GodModeLogin      string `envconfig:"GOD_MODE_LOGIN" required:"true"`
	JWTExpiration     int    `envconfig:"JWT_EXPIRATION" default:"3600"`
	DefaultTimeout    int    `envconfig:"DEFAULT_TIMEOUT" default:"30"`
	Env               string `envconfig:"ENV" required:"true"`

	// DATABASE config
	MongoURL        string `envconfig:"MONGO_URL" required:"true"`
	MongoDBName     string `envconfig:"MONGO_DBNAME" required:"true"`
	MongoTestDBName string `envconfig:"MONGO_TEST_DBNAME" default:"tests"`
	RedisURL        string `envconfig:"REDIS_URL" required:"true"`
	RedisTestURL    string `envconfig:"REDIS_TEST_URL" default:""`
	RedisExpiration int    `envconfig:"REDIS_DEFAULT_EXPIRATION" default:"3600"`

	// HUGGING FACE config
	HFAPIToken string `envconfig:"HF_API_TOKEN" required:"true"`

	// GCP config
	GoogleCredentials string `envconfig:"GOOGLE_APPLICATION_CREDENTIALS" default:""`
	GCPProjectID      string `envconfig:"GCP_PROJECT_ID" required:"true"`
	GCSBucketName     string `envconfig:"GCS_BUCKET_NAME" required:"true"`
	GCSBlobExpiration int    `envconfig:"GCS_BLOB_ACCESS_EXPIRATION" default:"3600"`
	GCSEmulatorPriv   string `envconfig:"GCS_EMULATOR_PRIVATE_URL" default:""`
	GCSEmulatorPub    string `envconfig:"GCS_EMULATOR_PUBLIC_URL" default:""`
}

// Global settings instance
var Env Settings

func init() {
	if err := envconfig.Process("", &Env); err != nil {
		log.Fatalf("Failed to load environment variables: %v", err)
	}
}
