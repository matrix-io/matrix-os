#!/bin/bash
set -e

# Useful to avoid weird bugs in development. This env var is set to true
# in the docker-compose.yml file so you always run with the modules set
# in the package.json. It is also useful to run with nodemon while developing.
if [ "$REINSTALL_NODE_MODULES" = "1" ]; then
  npm install -g nodemon
  rm -rf node_modules
  npm install
fi

if [ "$1" = 'node' ]; then
  exec node index.js
else
  exec "$@"
fi
