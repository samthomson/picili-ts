#!bin/bash

# pull latest and disregard and local changes
git fetch origin master
git reset --hard FETCH_HEAD
git clean -df

# restart containers
docker-compose -f docker-compose.prod.yml down
# comment this next line out for now until I have a better solution, it leads to super slow rebuilds
# docker-compose -f docker-compose.prod.yml build app
docker-compose -f docker-compose.prod.yml up -d
