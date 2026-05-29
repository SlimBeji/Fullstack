# Base Image
FROM oven/bun:1.3

# Create Working directory
WORKDIR /app

# Copying requirements
COPY ./frontend-vue/package.json /app/package.json

# Installing dependencies
RUN bun install

# Copy Code
COPY ./frontend-vue /app
