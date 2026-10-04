#!/bin/sh
set -e

CONFIG_FILE=/usr/share/nginx/html/config.js

if [ -z "${API_URL}" ]; then
    echo "API_URL is not set; the website will not be able to reach the backend." >&2
fi

printf 'window.MEFLIGHT_CONFIG = { apiUrl: "%s" };\n' "${API_URL%/}" > "${CONFIG_FILE}"
