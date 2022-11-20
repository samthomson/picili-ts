FROM mhart/alpine-node:16

# ensure ffmpeg is available for video processing
RUN apk add  --no-cache ffmpeg

WORKDIR /app

EXPOSE 3000
EXPOSE 4000
