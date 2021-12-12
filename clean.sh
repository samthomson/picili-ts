#!bin/bash

# clear db of certain things
docker-compose run app sh -c "cd server && yarn run clean"

# remove thumbs
sudo rm -Rf /home/sam/code/picili-ts/app/server/thumbs

# remove processing files
sudo rm -Rf /home/sam/code/picili-ts/app/server/processing
