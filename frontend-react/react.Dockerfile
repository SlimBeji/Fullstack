# Base Image
FROM node:22

# Create Working directory
WORKDIR /app

# Copying requirements
COPY ./frontend-react/package.json /app/package.json

# Installing dependencies
RUN npm install

# Copy Code
COPY ./frontend-react /app
