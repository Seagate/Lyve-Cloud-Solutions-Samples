#!/usr/bin/env bash

npm run build
docker rm fast-stream
docker rmi fast-stream
docker build -t fast-stream .