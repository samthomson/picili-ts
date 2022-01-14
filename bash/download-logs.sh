#!bin/bash
# this script should be run from project root
# -r means recursive (to get subfolders/files too), and -d means delta (make a local/remote comparison and download only the difference)

# load in env vars
SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"
source $SCRIPTPATH/../.env

echo "will pull logs from docker-machine host: $DOCKER_MACHINE_NAME"

docker-machine scp -r -d $DOCKER_MACHINE_NAME:/logs/picili-ts-server/ ./serverlogs