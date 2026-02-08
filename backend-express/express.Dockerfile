# Base Image
FROM node:22

# Create Working directory
WORKDIR /app

# Copying requirements
COPY ./backend-express/package.json /app/package.json

# Installing dependencies
RUN npm install
RUN npm audit fix

# Copy Code
COPY ./backend-express /app
