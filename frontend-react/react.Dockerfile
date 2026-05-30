# Base Image
FROM oven/bun:1.3

# Create Working directory
WORKDIR /app

# Copying requirements
COPY ./frontend-react/package.json /app/package.json
COPY ./frontend-react/bun.lock /app/bun.lock

# Installing dependencies
RUN bun install

# Copy Code
COPY ./frontend-react /app
