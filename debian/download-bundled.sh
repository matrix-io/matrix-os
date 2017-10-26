#!/bin/bash

rm -rf dist/node && mkdir -p dist/node
curl -SL https://nodejs.org/dist/v6.11.4/node-v6.11.4-linux-armv7l.tar.gz | tar xz -C dist/node --strip-components 1

export PATH=$PATH:$(pwd)/dist/node/bin
./dist/node/bin/npm install --prefix dist/ ..
