-- Table
CREATE TABLE "users" (
    "id" serial PRIMARY KEY,
    "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "password" text NOT NULL,
    "image_url" text NOT NULL DEFAULT '',
    "is_admin" boolean NOT NULL DEFAULT false,
    CONSTRAINT "uni_users_email" UNIQUE ("email")
);
-- Indexes
CREATE INDEX "idx_users_created_at" ON "users" ("created_at");
