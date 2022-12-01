# picili-ts

Picili synchronizes with a chosen directory on dropbox, it then indexes image/video metadata and detected subjects making all your pictures and videos searchable and easy to explore.

Video formats supported: Mp4, Mov, Avi, Mts. (Note: tested on a low spec VPS, video processing works - but takes ages. eg 36m for a 50s vid. If you want to use picili with many videos, a higher spce VPS may be better.)

## 1.0 Build

### 1.1 create dropbox app

Create an app on dropbox, and whitelist the following URL:
`http://localhost/admin/dropbox`
and the same for whatever production URL if you'll deploy it (but with https).

### 1.2 configure and build localy

0. Make a copy of the environmental variables required by running `cp .env.sample .env` and then fill them all in. 
1. First run `docker-compose build app` to build the base containers for the application.
2. Then run `docker-compose run app sh -c "cd spa && yarn --silent && cd ../server && yarn --silent && yarn run migrate"` to install the dependencies of the project's parts (server & spa) in the respective places.

todo: probably need to run db migrations?

## 2.0 Run

`docker-compose up app` 

While testing, the task processor can be run independently: `docker-compose run app sh -c "cd /app/server && yarn run start-task-manager"`. But should not as a rule, since it should run in the same scope as the server so that they share the same instance.

accessing services:
SPA: `http://localhost:3500`
API: `http://localhost:3501/graphql`
phpmyadmin: `http://localhost:8083`

Note: make sure `"request.credentials": "include"` is set in graphiql's settings so that once authed in the SPA the cookies will be used for requests in the graphiql playground.

### testing

Run end to end test: `docker-compose up --abort-on-container-exit --exit-code-from e2e`.
This will output to `/e2e/cypress/*` directories.

## 3.0 How it works

A `TaskManager` is always running in the background, working through **tasks**. These can be anything from syncing with dropbox, to performing subject detection on a newly imported file.
Once a connection with dropbox is made via OAuth, and a directory (within your dropbox folder) that picili should sync with, it sets up a recurring task to **sync**.

**syncing** looks at all the files (recursively) in the said dropbox folder location. It keeps a local list of files to compare with, and can then notice new/changed/removed files. For any new or changed files, it looks to import them. Files removed from the dropbox folder are removed from picili too.

**importing** a file downloads a copy from dropbox to picili so that it can analyze it. It tries to generate some fitting tags, while also generating thumbnails to use in the interface. Tags are generated via external APIs too which picili is careful to stay within the free tier of (due to this tagging via external APIs can be spread out over multiple days as/when throttled). Lastly the downloaded file is removed, once tagging is complete.

### tag types and external APIs used

|tag types generated |requires GPS *  |requires [subject] **  | Uses external API| API used|
--- | --- | --- | --- | ---
|directories|||||
|date|||||
|exif data|||||
|subject|||&check;|[Imagga](https://imagga.com/)|
|address / location| &check; ||&check;|[Location IQ](https://locationiq.com/)|
|elevation|&check;||&check;|[Google Elevation API](https://developers.google.com/maps/documentation/elevation/overview)|
|plant species||&check;|&check;|[Pl@nt Net](https://my.plantnet.org/)|
|text / OCR||&check;|&check;|[OCR Space](http://ocr.space/)|
|text / number plates||&check;|&check;|[Plate recognizer](https://platerecognizer.com/)|

[*] Some APIs require a latitude/longitude, so are only called if the image was geotagged.

[**] These APIs are called conditionally based on the results of subject detection. For example if *plant*, *flower*, or *tree* is detected as a subject tag, then a task will be created to have the plant detection API called for that picture.

For videos, an image is generated from only the first frame and sent to imagga for subject detection.

### authentication

upon logging in a jwt is generated and stored as a cookie on the request. This is checked on a cold start via the API to determine an initial auth status. The contained JWT is then added on all requests and the API's middleware looks for it to determine an auth status for API queries/mutations.

## 4.0 Deployment

Testing and targeting Digital Ocean's $5/m VPS. 1GB ram, and 1GB swap enabled.

### 4.1 initial deploy

1. if not done already:
	- create a VPS as per https://github.com/samthomson/readme/tree/master/docker-machine
	- [generate an ssh key and add to github](https://github.com/samthomson/readme/tree/master/docker-machine#optional)
2. `bash ./initial-deployment.sh`

The above will simply clone the repo to the server and copy the local `.env` file there.
You must next run the remote-redeploy script to [re]start the containers.

#### nginx

In produciton the SPA is served statically, and the API run dynamically. Both are run from the same container, with a separate nginx container acting as a gateway. You must set the required environment variables with domain names (without protocol or trailing slash) for nginx to listen out for - and segregate traffic based on.

### 4.2 update / redeploy

`bash ./remote-redeploy.sh`

#### env vars

If you change the `.env` values for production environmental variables you'll need to re-upload the `.env` file to your server. (replace `$DOCKER_MACHINE_NAME` with your host machine name)

`docker-machine scp .env $DOCKER_MACHINE_NAME:/picili-ts/.env`

### 4.3 download log files

The prod docker-compose maps the log directory from the container to the host. So can be downloaded via scp (run command from root):

`bash ./bash/download-logs.sh` (to `/serverlogs`)

### 4.4 Technologies used

Docker and docker-compose are used for containerization. The application is comprised of a backend (Node Typescript / GraphQL) and a frontend (React TypeScript / redux / sagas). MySQL is used as the database.

The project leans on various APIS and libraries. Such as
- docker/[compose]/[machine]
- videos.js.
- mapbox
- supercluster (also somewhat by mapbox)