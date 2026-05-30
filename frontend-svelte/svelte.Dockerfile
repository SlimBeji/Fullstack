# Base Image
FROM oven/bun:1.3

# Create Working directory
WORKDIR /app

# Copying requirements
COPY ./frontend-svelte/package.json /app/package.json
COPY ./frontend-svelte/bun.lock /app/bun.lock

# Installing dependencies
RUN bun install

# Copy Code
COPY ./frontend-svelte /app
