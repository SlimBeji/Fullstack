# Base Image
FROM python:3.11.11

# Create Working directory
WORKDIR /app

# Updating pip
RUN pip install --upgrade pip

# Copying  and installing requirements
COPY ./fastapi /app
RUN pip install -r requirements.txt
