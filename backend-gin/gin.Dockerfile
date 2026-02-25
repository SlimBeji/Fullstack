# Base Image
FROM golang:1.26

# Create Working directory
WORKDIR /app

# Copying requirements
COPY ./backend-gin/go.mod ./backend-gin/go.sum ./

# Installing dependencies
RUN go mod download

# Install air for autoreload
RUN go install github.com/air-verse/air@v1.61.4
# Install swag cmd for swagger
RUN go install github.com/swaggo/swag/cmd/swag@latest
# Atlas atlas CLI for migration
RUN curl -sSf https://atlasgo.sh | sh
# Install GORM provider for atlas
RUN go install ariga.io/atlas-provider-gorm@latest

# Copy Code
COPY ./backend-gin /app

# Ensure all modules are tidy
RUN go mod tidy
