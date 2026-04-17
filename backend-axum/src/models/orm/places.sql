-- Table
CREATE TABLE "places" (
    "id" serial PRIMARY KEY,
    "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" text NOT NULL,
    "description" text NOT NULL,
    "address" text NOT NULL,
    "image_url" text NOT NULL DEFAULT '',
    "location" jsonb NOT NULL,
    "embedding" vector(384) NULL,
    "creator_id" integer NOT NULL,
    CONSTRAINT "fk_users_places" FOREIGN KEY ("creator_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
    CONSTRAINT "location_structure" CHECK (
        location ? 'lat' AND
        location ? 'lng' AND
        jsonb_typeof(location->'lat') = 'number' AND
        jsonb_typeof(location->'lng') = 'number'
    )
);
-- Indexes
CREATE INDEX "idx_place_creator" ON "places" ("creator_id");
CREATE INDEX "idx_places_created_at" ON "places" ("created_at");
CREATE INDEX "idx_place_embedding_vector" ON "places" USING ivfflat (embedding vector_cosine_ops);
