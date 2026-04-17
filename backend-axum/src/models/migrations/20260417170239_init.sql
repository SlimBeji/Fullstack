-- MANUALLY ADDED:
CREATE EXTENSION IF NOT EXISTS "vector";
-- Create "users" table
CREATE TABLE "users" (
  "id" serial NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "password" text NOT NULL,
  "image_url" text NOT NULL DEFAULT '',
  "is_admin" boolean NOT NULL DEFAULT false,
  PRIMARY KEY ("id"),
  CONSTRAINT "uni_users_email" UNIQUE ("email")
);
-- Create index "idx_users_created_at" to table: "users"
CREATE INDEX "idx_users_created_at" ON "users" ("created_at");
-- Create "places" table
CREATE TABLE "places" (
  "id" serial NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "address" text NOT NULL,
  "image_url" text NOT NULL DEFAULT '',
  "location" jsonb NOT NULL,
  "embedding" vector(384) NULL,
  "creator_id" integer NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_users_places" FOREIGN KEY ("creator_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "location_structure" CHECK ((location ? 'lat'::text) AND (location ? 'lng'::text) AND (jsonb_typeof((location -> 'lat'::text)) = 'number'::text) AND (jsonb_typeof((location -> 'lng'::text)) = 'number'::text))
);
-- Create index "idx_place_creator" to table: "places"
CREATE INDEX "idx_place_creator" ON "places" ("creator_id");
-- Create index "idx_place_embedding_vector" to table: "places"
CREATE INDEX "idx_place_embedding_vector" ON "places" USING IVFFLAT ("embedding" vector_cosine_ops);
-- Create index "idx_places_created_at" to table: "places"
CREATE INDEX "idx_places_created_at" ON "places" ("created_at");
