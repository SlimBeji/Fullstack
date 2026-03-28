# Base Image
FROM rust:slim

# Create Working directory
WORKDIR /app

# Install cargo-watch for hot reload
RUN cargo install cargo-watch
# Install rystfmt and clippy for formatting
RUN rustup component add rustfmt
RUN rustup component add clippy
# Install sea-orm-cli and atlas for migrations
RUN cargo install sea-orm-cli --no-default-features --features runtime-tokio-rustls
RUN curl -sSf https://atlasgo.sh | sh

# Install dependencies
COPY backend-axum/Cargo.toml /app/Cargo.toml
RUN cargo generate-lockfile && cargo fetch

# Copying project
COPY ./backend-axum /app
