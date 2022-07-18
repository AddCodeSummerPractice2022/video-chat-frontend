# vars

DOCKER_NAMESPACE=addcode-practicum
DOCKER_IMAGE=$(DOCKER_NAMESPACE):video-chat-frontend
DOCKER_CONTAINER_NAME=video-chat-frontend
DOCKER_HOST=ssh://$(user)@$(ip)

# build

build:
	docker build -t $(DOCKER_IMAGE) -f deploy/Dockerfile .

# start

start:
	docker run -d --name $(DOCKER_CONTAINER_NAME) -p 80:80 $(DOCKER_IMAGE)

# stop

stop:
	docker stop $(DOCKER_CONTAINER_NAME)
	docker rm $(DOCKER_CONTAINER_NAME)

# deploy

deployment:
	DOCKER_HOST=ssh://$(user)@$(ip) docker build -t $(DOCKER_IMAGE) -f deploy/Dockerfile .
	DOCKER_HOST=ssh://$(user)@$(ip) docker stop $(DOCKER_CONTAINER_NAME)
	DOCKER_HOST=ssh://$(user)@$(ip) docker rm $(DOCKER_CONTAINER_NAME)
	DOCKER_HOST=ssh://$(user)@$(ip) docker run -d --name $(DOCKER_CONTAINER_NAME) -p 80:80 $(DOCKER_IMAGE)
