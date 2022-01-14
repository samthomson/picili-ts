#!bin/bash

SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"
source $SCRIPTPATH/.env

echo "we'll redeploy to our docker-machine host: $DOCKER_MACHINE_NAME"

docker-machine ssh $DOCKER_MACHINE_NAME "cd /picili-ts && bash pull-latest-and-restart-containers.sh"