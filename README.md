# picili-ts

## 1.0 Build

[todo]
[ copy .env]

### create dropbox app

Create an app on dropbox, and whitelist the following URL:
`http://localhost/admin/dropbox`
and the same for whatever production URL if you'll deploy it (but with https).

## 2.0 Run

`docker-compose up app` 

While testing, the task processor can be run independently: `docker-compose run app sh -c "cd /app/server && yarn run start-task-manager"`. But should not as a rule, since it should run in the same scope as the server so that they share the same instance.

accessing services:
SPA: `http://localhost:3500`
API: `http://localhost:3501/graphql`
phpmyadmin: `http://localhost:8083`

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

## 4.0 Deployment

Testing and targeting Digital Ocean's $5/m VPS.

### 4.1 initial deploy

1. if not done already:
	- create a VPS as per https://github.com/samthomson/readme/tree/master/docker-machine
	- [generate an ssh key and add to github](https://github.com/samthomson/readme/tree/master/docker-machine#optional)
2. `bash ./initial-deployment.sh`

[//todo: something about the nginx sample]


### 4.2 update / redeploy

`bash ./remote-redeploy.sh`

### 4.3 download log files

The prod docker-compose maps the log directory from the container to the host. So can be downloaded via scp (run command from root):

`bash ./bash/download-logs.sh` (to `/serverlogs`)

