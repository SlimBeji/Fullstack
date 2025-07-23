# Dev commands
fix-permission:
	sudo chown -R $$USER:$$USER ./

# Docker commands
run:
	docker-compose down
	docker-compose up --attach fastapi --attach react 

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

react-check:
	docker exec -it react npx tsc --noEmit

# Express commands
express-build:
	docker-compose build express
	cd backend-express; npm install

express-bash:
	docker exec -it express bash

express-test:
	docker exec -it express npm test

express-check:
	docker exec -it express npx tsc --noEmit

express-script/%:
	docker exec -it express npx ts-node src/scripts/$*

express-seed:
	docker exec -it express npx ts-node src/scripts/seedDb.ts

express-dump:
	docker exec -it express npx ts-node src/scripts/dumpDb.ts

# FastAPI commands
fastapi-build:
	docker-compose build fastapi

fastapi-bash:
	docker exec -it fastapi bash


