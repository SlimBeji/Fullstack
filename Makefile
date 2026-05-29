# Dev commands
fix-permission:
	sudo find . ! -path './pgsql/*' -exec chown $$USER:$$USER {} +

podman-stat:
	podman system df

podman-clean:
	podman system prune -a --volumes

stop:
	podman-compose down

run: stop
	podman-compose up

# React commands
react-build:
	podman-compose build react
	cd frontend-react; npm install

react-bash:
	podman exec -it react bash

react-lint:
	podman exec -it react npx tsc -b --noEmit
	podman exec -it react npx eslint "src/**/*.ts" --fix
	podman exec -it react npx eslint "src/**/*.tsx" --fix
	podman exec -it react npx prettier --write . | grep -v "(unchanged)"

# Vue commands
vue-build:
	podman-compose build vue
	cd frontend-vue; npm install

vue-bash:
	podman exec -it vue bash

vue-lint:
	podman exec -it vue npm run lint
	podman exec -it vue npm run format | grep -v "(unchanged)"

# Svelte commands
svelte-build:
	podman-compose build svelte
	cd frontend-svelte; npm install

svelte-bash:
	podman exec -it svelte bash

svelte-lint:
	podman exec -it svelte npm run lint
	podman exec -it svelte npm run format | grep -v "(unchanged)"

# Express commands
express-build:
	podman-compose build express
	cd backend-express; npm install

express-bash:
	podman exec -it express bash

express-diff/%:
	podman exec -it -w /app/src/models/migrations express npx ts-node --esm ../../../node_modules/typeorm/cli.js migration:generate $* -d ../orm/data-source.ts

express-migrate:
	podman exec -it -w /app/src/models/migrations express npx ts-node --esm ../../../node_modules/typeorm/cli.js migration:run -d ../orm/data-source.ts
	podman exec -it -w /app/src/models/migrations express npx ts-node --esm ../../../node_modules/typeorm/cli.js migration:run -d ../orm/data-source-test.ts

express-revert:
	podman exec -it -w /app/src/models/migrations express npx ts-node --esm ../../../node_modules/typeorm/cli.js migration:revert -d ../orm/data-source.ts
	podman exec -it -w /app/src/models/migrations express npx ts-node --esm ../../../node_modules/typeorm/cli.js migration:revert -d ../orm/data-source-test.ts

express-test:
	pdoman exec -it express npm test

express-lint:
	podman exec -it express npx tsc -b --noEmit
	podman exec -it express npx eslint "src/**/*.ts" --fix
	podman exec -it express npx prettier --write "src/**/*.{ts,js,json,css,html}" | grep -v "(unchanged)"

express-script/%:
	podman exec -it express npx tsx -r tsconfig-paths/register src/bin/$*

express-debug:
	podman exec -it express npx ts-node -r tsconfig-paths/register src/bin/debug.ts

express-seed:
	podman exec -it express npx ts-node -r tsconfig-paths/register src/bin/seedDb.ts

express-dump:
	podman exec -it express npx ts-node -r tsconfig-paths/register src/bin/dumpDb.ts

# FastAPI commands
fastapi-build:
	podman-compose build fastapi

fastapi-bash:
	podman exec -it fastapi bash

fastapi-alembic:
	podman exec -it -w /app/models/migrations fastapi alembic init alembic

fastapi-diff/%:
	podman exec -it -w /app/models/migrations fastapi alembic revision --autogenerate -m $*

fastapi-migrate:
	podman exec -it -w /app/models/migrations fastapi alembic upgrade head
	podman exec -it -w /app/models/migrations fastapi sh -c "ALEMBICENV=test alembic upgrade head"

fastapi-revert:
	podman exec -it -w /app/models/migrations fastapi alembic downgrade -1
	podman exec -it -w /app/models/migrations fastapi sh -c "ALEMBICENV=test alembic downgrade -1"

fastapi-test:
	podman exec -it fastapi pytest /app/tests

fastapi-lint:
	podman exec -it fastapi ruff check . --fix
	podman exec -it fastapi ruff format .
	podman exec -it fastapi mypy .

fastapi-script/%:
	podman exec -it fastapi python /app/bin/$*

fastapi-debug:
	podman exec -it fastapi python /app/bin/debug.py

fastapi-seed:
	podman exec -it fastapi python /app/bin/seed_db.py

fastapi-dump:
	podman exec -it fastapi python /app/bin/dump_db.py

# Gin commands
gin-build:
	podman-compose build gin

gin-bash:
	podman exec -it gin bash

gin-atlas:
	podman exec -it pgsql psql -U dev -c "DROP DATABASE IF EXISTS atlas_gin_dev WITH (FORCE);"
	podman exec -it pgsql psql -U dev -c "CREATE DATABASE atlas_gin_dev;"
	podman exec -it pgsql psql -U dev -d atlas_gin_dev -c "CREATE EXTENSION IF NOT EXISTS vector;"
	podman exec -it test-pgsql psql -U test -c "DROP DATABASE IF EXISTS atlas_gin_dev WITH (FORCE);"
	podman exec -it test-pgsql psql -U test -c "CREATE DATABASE atlas_gin_dev;"
	podman exec -it test-pgsql psql -U test -d atlas_gin_dev -c "CREATE EXTENSION IF NOT EXISTS vector;"

gin-diff/%:
	podman exec -it -w /app/internal/models/migrations gin atlas migrate diff $* --env dev

gin-migrate:
	podman exec -it -w /app/internal/models/migrations gin atlas migrate hash --dir file://./
	podman exec -it -w /app/internal/models/migrations gin atlas migrate apply --env dev --allow-dirty
	podman exec -it -w /app/internal/models/migrations gin atlas migrate apply --env test --allow-dirty

gin-revert:
	podman exec -it -w /app/internal/models/migrations gin atlas migrate down --env dev
	podman exec -it -w /app/internal/models/migrations gin atlas migrate down --env test

gin-test:
	podman exec -it gin go test -failfast /app/internal/tests/... -p=1

gin-swagger:
	podman exec -it gin swag init -g ./app.go -o internal/api/docs -q

gin-lint: gin-swagger
	podman exec -it gin go fmt .
	podman exec -it gin go vet .
	podman exec -it gin go build .

gin-script/%:
	podman exec -it gin go run /app/cmd/scripts $*

gin-debug:
	podman exec -it gin go run /app/cmd/scripts debug

gin-seed:
	podman exec -it gin go run /app/cmd/scripts seed

gin-dump:
	podman exec -it gin go run /app/cmd/scripts dump

# Axum commands
axum-build:
	podman-compose build axum

axum-bash:
	podman exec -it axum bash

axum-atlas:
	podman exec -it pgsql psql -U dev -c "DROP DATABASE IF EXISTS atlas_axum_dev WITH (FORCE);"
	podman exec -it pgsql psql -U dev -c "CREATE DATABASE atlas_axum_dev;"
	podman exec -it pgsql psql -U dev -d atlas_axum_dev -c "CREATE EXTENSION IF NOT EXISTS vector;"
	podman exec -it test-pgsql psql -U test -c "DROP DATABASE IF EXISTS atlas_axum_dev WITH (FORCE);"
	podman exec -it test-pgsql psql -U test -c "CREATE DATABASE atlas_axum_dev;"
	podman exec -it test-pgsql psql -U test -d atlas_axum_dev -c "CREATE EXTENSION IF NOT EXISTS vector;"

axum-diff/%:
	podman exec -it -w /app/src/models/migrations axum atlas migrate diff $* --env dev

axum-migrate:
	podman exec -it -w /app/src/models/migrations axum atlas migrate hash --dir file://./
	podman exec -it -w /app/src/models/migrations axum atlas migrate apply --env dev --allow-dirty
	podman exec -it -w /app/src/models/migrations axum atlas migrate apply --env test --allow-dirty

axum-revert:
	podman exec -it -w /app/src/models/migrations axum atlas migrate down --env dev
	podman exec -it -w /app/src/models/migrations axum atlas migrate down --env test

axum-test:
	podman exec -it axum cargo test -- --test-threads=1

axum-lint:
	podman exec -it axum cargo fmt
	podman exec -it axum cargo clippy

axum-script/%:
	podman exec -it axum cargo run --bin $*

axum-debug:
	podman exec -it axum cargo run --bin debug

axum-seed:
	podman exec -it axum cargo run --bin seed

axum-dump:
	podman exec -it axum cargo run --bin dump
