# Base Image
FROM golang:1.25-alpine

# Create Working directory
WORKDIR /app

# Copying requirements
COPY ./backend-gin/go.mod ./backend-gin/go.sum ./

# Installing dependencies
RUN go mod download

# Install air for autoreload
RUN go install github.com/air-verse/air@v1.61.4

# Copy Code
COPY ./backend-gin /app

# Ensure all modules are tidy
RUN go mod tidy
