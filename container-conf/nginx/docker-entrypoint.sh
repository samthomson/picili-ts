#!/usr/bin/env sh
set -eu

envsubst '${API_SERVER_NAME} ${SPA_SERVER_NAME}' < /etc/nginx/conf.d/nginx-proxy.template > /etc/nginx/conf.d/nginx-proxy.conf

exec "$@"
