# Dev commands
fix-permission:
	sudo chown -R $$USER:$$USER ./

# Docker commands
run:
	docker-compose down
	docker-compose up --attach express --attach react

build:
	docker-compose build
	cd react; npm install
	cd express; npm install

# DB commands
dump-mongo: fix-permission
	rm -rf db/

# React commands
react-bash:
	docker exec -it react bash

# Express commands
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
