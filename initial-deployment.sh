#!bin/bash

SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"
source $SCRIPTPATH/.env

docker-machine ssh $DOCKER_MACHINE_NAME "cd /; git clone https://github.com/samthomson/picili-ts.git"

docker-machine scp .env $DOCKER_MACHINE_NAME:/picili-ts/.env