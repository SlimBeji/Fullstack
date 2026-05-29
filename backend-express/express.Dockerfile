# Base Image
FROM oven/bun:1.3.14

# Create Working directory
WORKDIR /app

# Copying requirements
COPY ./backend-express/package.json /app/package.json

# Installing dependencies
RUN bun install

# Copy Code
COPY ./backend-express /app