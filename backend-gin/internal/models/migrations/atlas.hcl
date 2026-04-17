locals {
  src = [
    "file://../orm/users.sql",
    "file://../orm/places.sql",
  ]
  dir = "file://."
  exclude = ["alembic_version", "migrations", "atlas_schema_revisions"]
  revisions_schema = "gin_revisions"
}

data "external_schema" "gorm" {
  program = [
    "go", "run", "-mod=mod",
    "ariga.io/atlas-provider-gorm",
    "load",
    "--path", "../orm",
    "--dialect", "postgres"
  ]
}

env "dev" {
  src = data.external_schema.gorm.url
  url = "postgresql://dev:dev@pgsql:5432/dev?sslmode=disable"
  dev = "postgresql://dev:dev@pgsql:5432/atlas_gin_dev?sslmode=disable&search_path=public"
  exclude = local.exclude
  migration {
    dir = local.dir
    revisions_schema = local.revisions_schema
  }
}

env "test" {
  src = data.external_schema.gorm.url
  url = "postgresql://test:test@test-pgsql:5432/test?sslmode=disable"
  dev = "postgresql://test:test@test-pgsql:5432/atlas_gin_dev?sslmode=disable&search_path=public"
  exclude = local.exclude
  migration {
    dir = local.dir
    revisions_schema = local.revisions_schema
  }
}
