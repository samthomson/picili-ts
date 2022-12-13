#!bin/bash

SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"
source $SCRIPTPATH/../.env

echo "will upload .env file to the docker-machine host: $DOCKER_MACHINE_NAME"

docker-machine scp .env $DOCKER_MACHINE_NAME:/picili-ts/.env
