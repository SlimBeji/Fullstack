# Base Image
FROM rust:alpine

# Create Working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache wget musl-dev

# Install cargo-watch for hot reload
RUN cargo install cargo-watch
# Install rustfmt and clippy for code formatting
RUN rustup component add rustfmt
RUN rustup component add clippy
# Install sea-orm-cli
RUN cargo install sea-orm-cli --no-default-features --features runtime-tokio-rustls
# Install atlas
RUN wget -q https://release.ariga.io/atlas/atlas-linux-amd64-latest -O /usr/local/bin/atlas \
    && chmod +x /usr/local/bin/atlas

# Install dependencies
COPY backend-axum/Cargo.toml /app/Cargo.toml
RUN cargo generate-lockfile && cargo fetch

# Copy project
COPY ./backend-axum /app
