# Base Image
FROM golang:1.25

# Create Working directory
WORKDIR /app

# Copying requirements
COPY ./backend-gin/go.mod ./backend-gin/go.sum ./

# Installing dependencies
RUN go mod download

# Install air for autoreload and swag cmd for swagger
RUN go install github.com/air-verse/air@v1.61.4
RUN go install github.com/swaggo/swag/cmd/swag@latest

# Copy Code
COPY ./backend-gin /app

# Ensure all modules are tidy
RUN go mod tidy
