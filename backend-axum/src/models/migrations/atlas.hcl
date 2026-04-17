locals {
  src = [
    "file://../orm/users.sql",
    "file://../orm/places.sql",
  ]
  dir = "file://."
  exclude = ["alembic_version", "migrations", "atlas_schema_revisions"]
  revisions_schema = "axum_revisions"
}

env "dev" {
  src = local.src
  url = "postgresql://dev:dev@pgsql:5432/dev?sslmode=disable"
  dev = "postgresql://dev:dev@pgsql:5432/atlas_axum_dev?sslmode=disable&search_path=public"
  exclude = local.exclude
  migration {
    dir = local.dir
    revisions_schema = local.revisions_schema
  }
}

env "test" {
  src = local.src
  url = "postgresql://test:test@test-pgsql:5432/test?sslmode=disable"
  dev = "postgresql://test:test@test-pgsql:5432/atlas_axum_dev?sslmode=disable&search_path=public"
  exclude = local.exclude
  migration {
    dir = local.dir
    revisions_schema = local.revisions_schema
  }
}
