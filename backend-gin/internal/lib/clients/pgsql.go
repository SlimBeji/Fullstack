package clients

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

const LogLevel = logger.Silent

type PgClientConfig struct {
	URL             string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime int // duration in seconds
	ConnMaxIdleTime int // duration in seconds
}

type PgClient struct {
	config PgClientConfig
	DB     *gorm.DB
	sqlDB  *sql.DB
}

func (p *PgClient) Close() error {
	return p.sqlDB.Close()
}

func (p *PgClient) ListTables(ctx context.Context) ([]string, error) {
	var tables []string

	query := `SELECT tablename FROM pg_tables WHERE schemaname = "public"`
	rows, err := p.sqlDB.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list tables: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var tableName string
		if err := rows.Scan(&tableName); err != nil {
			return nil, fmt.Errorf("failed to scan table name: %w", err)
		}
		tables = append(tables, tableName)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating tables: %w", err)
	}

	return tables, nil
}

func (p *PgClient) ResetTable(ctx context.Context, table string) error {
	query := fmt.Sprintf(`TRUNCATE TABLE "public"."%s" RESTART IDENTITY CASCADE`, table)

	if _, err := p.sqlDB.ExecContext(ctx, query); err != nil {
		return fmt.Errorf("failed to reset table %s: %w", table, err)
	}
	return nil
}

func configurePool(sqlDB *sql.DB, config PgClientConfig) {
	// Set defaults
	if config.MaxOpenConns == 0 {
		config.MaxOpenConns = 25
	}
	if config.MaxIdleConns == 0 {
		config.MaxIdleConns = 5
	}
	if config.ConnMaxLifetime == 0 {
		config.ConnMaxLifetime = 3600
	}
	if config.ConnMaxIdleTime == 0 {
		config.ConnMaxIdleTime = 300
	}

	// Configure connection pool
	sqlDB.SetMaxOpenConns(config.MaxOpenConns)
	sqlDB.SetMaxIdleConns(config.MaxOpenConns)
	sqlDB.SetConnMaxLifetime(time.Duration(config.ConnMaxLifetime) * time.Second)
	sqlDB.SetConnMaxIdleTime(time.Duration(config.ConnMaxIdleTime) * time.Second)
}

func NewPgClient(config PgClientConfig) *PgClient {
	// GORM config
	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(LogLevel),
	}

	// Connect to database
	db, err := gorm.Open(postgres.Open(config.URL), gormConfig)
	if err != nil {
		panic(fmt.Sprintf("failed to connect to PostgreSQL: %v", err))
	}

	// Get underlying sql.DB to configure connection pool
	sqlDB, err := db.DB()
	if err != nil {
		panic(fmt.Sprintf("failed to get database instance: %v", err))
	}
	configurePool(sqlDB, config)

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := sqlDB.PingContext(ctx); err != nil {
		panic(fmt.Sprintf("failed to ping PostgreSQL: %v", err))
	}

	// Returning struct ref
	return &PgClient{
		config: config,
		DB:     db,
		sqlDB:  sqlDB,
	}
}
