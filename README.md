# picili-ts

## build

[todo]

## run

`docker-compose up` 

While testing, the task processor can be run independently: `docker-compose run app sh -c "cd /app/server && yarn run start-task-manager"`. But should not as a rule, since it should run in the same scope as the server so that they share the same instance.
