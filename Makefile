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
bash-react:
	docker exec -it react bash

# Express commands
bash-express:
	docker exec -it express bash

test-express:
	docker exec -it express npm test
