# Base Image
FROM node:22

# Create Working directory
WORKDIR /app

# Copying requirements
COPY ./express/package.json /app/package.json

# Installing dependencies
RUN npm install

# Copy Code
COPY ./express /app
