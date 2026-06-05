# Base Image
# Angular CLI requires node 22.22.3 minimum
FROM imbios/bun-node:1.3-22.22.3-debian

# Create Working directory
WORKDIR /app

# Copying requirements
COPY ./frontend-angular/package.json /app/package.json
COPY ./frontend-angular/bun.lock /app/bun.lock

# Installing dependencies
RUN bun install

# Copy Code
COPY ./frontend-angular /app
