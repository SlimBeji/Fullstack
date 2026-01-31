# Base Image
FROM rust:slim

# Create Working directory
WORKDIR /app

# Install tools for auto-reload and linting
RUN cargo install cargo-watch
RUN rustup component add rustfmt
RUN rustup component add clippy

# Install dependencies
COPY backend-axum/Cargo.toml /app/Cargo.toml
RUN cargo generate-lockfile && cargo fetch

# Copying project
COPY ./backend-axum /app
