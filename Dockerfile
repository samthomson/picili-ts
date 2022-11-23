# changed from mhart/alpine-node:16 to the official node repo to find an image for arm/m1 
FROM node:16.18.1-alpine3.15

WORKDIR /app

EXPOSE 3000
EXPOSE 4000
