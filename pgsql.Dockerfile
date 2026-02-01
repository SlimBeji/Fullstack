FROM postgres:18

RUN apt-get update
RUN apt-get install -y postgresql-18-pgvector
RUN rm -rf /var/lib/apt/lists/*
