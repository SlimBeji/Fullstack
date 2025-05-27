#################### Variables ############################

# OS variables
# https://stackoverflow.com/questions/714100/os-detecting-makefile
ifeq ($(OS),Windows_NT)
	# Windows does not support uname command
    os_name := Windows
else
    os_name := $(shell uname -s)
	ifeq ($(os_name), Linux)
		open-browser := nohup xdg-open
		log-redirection := > /dev/null 2>&1
	else ifeq ($(os_name), Darwin)
		open-browser := open
	endif
endif

# Dev variables
dev-urls := http://localhost:5000 http://localhost:8000 

#################### Commands ############################

# Dev commands
pages:
ifeq ($(os_name), Windows_NT)
	echo Not Implemented in Windows
else
	for url in $(dev-urls) ; do \
	eval '$(open-browser) $$url $(log-redirection)' ; \
	done
endif

fix-permission:
	sudo chown -R $$USER:$$USER ./

# Docker commands
run:
	docker-compose down
	docker-compose up --attach backend --attach frontend

build:
	docker-compose build
	cd frontend; npm install
	cd backend; npm install

# DB commands
dump-mongo: fix-permission
	rm -rf db/

# Frontend commands
bash-frontend:
	docker exec -it frontend bash

# Backend commands
bash-backend:
	docker exec -it backend bash

# Run Backend tests
test-backend:
	docker exec -it backend npm test

# Check ts errors
check-ts:
	tsc --noEmit ./backend
