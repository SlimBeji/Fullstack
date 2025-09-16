# Dev commands
fix-permission:
	sudo chown -R $$USER:$$USER ./

# Docker commands
run:
	docker-compose down
	docker-compose up --attach fastapi --attach vue 

build:
	docker-compose build
	cd frontend-react; npm install
	cd backend-express; npm install

# DB commands
dump-mongo: fix-permission
	rm -rf db/

# React commands
react-build:
	docker-compose build react
	cd frontend-react; npm install

react-bash:
	docker exec -it react bash

react-lint:
	docker exec -it react npx tsc -b --noEmit
	docker exec -it react npx eslint "src/**/*.ts" --fix
	docker exec -it react npx eslint "src/**/*.tsx" --fix
	docker exec -it react npx prettier --write . | grep -v "(unchanged)"

# Vue commands
vue-build:
	docker-compose build vue
	cd frontend-vue; npm install

vue-bash:
	docker exec -it vue bash

vue-lint:
	docker exec -it vue npm run lint
	docker exec -it vue npm run format | grep -v "(unchanged)"

# Express commands
express-build:
	docker-compose build express
	cd backend-express; npm install

express-bash:
	docker exec -it express bash

express-test:
	docker exec -it express npm test

express-lint:
	docker exec -it express npx tsc -b --noEmit
	docker exec -it express npx eslint "src/**/*.ts" --fix
	docker exec -it express npx prettier --write "src/**/*.{ts,js,json,css,html}" | grep -v "(unchanged)"

express-script/%:
	docker exec -it express npx ts-node src/scripts/$*

express-debug:
	docker exec -it express npx ts-node src/scripts/debug.ts

express-seed:
	docker exec -it express npx ts-node src/scripts/seedDb.ts

express-dump:
	docker exec -it express npx ts-node src/scripts/dumpDb.ts

# FastAPI commands
fastapi-build:
	docker-compose build fastapi

fastapi-bash:
	docker exec -it fastapi bash

fastapi-test:
	docker exec -it fastapi pytest /app/tests

fastapi-lint:
	docker exec -it fastapi autoflake -r --in-place --remove-all-unused-imports --exclude=**/__init__.py  ./
	docker exec -it fastapi isort . --settings-path .isort.cfg
	docker exec -it fastapi python -m black .
	docker exec -it fastapi mypy .

fastapi-script/%:
	docker exec -it fastapi python /app/scripts/$*

fastapi-debug:
	docker exec -it fastapi python /app/scripts/debug.py

fastapi-seed:
	docker exec -it fastapi python /app/scripts/seed_db.py

fastapi-dump:
	docker exec -it fastapi python /app/scripts/dump_db.py
