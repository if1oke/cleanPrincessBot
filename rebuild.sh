#!/bin/bash
echo 'Starting rebuild princessBot'
docker stop princessbot
docker rm princessbot
docker build . -t princessbot
docker run --restart=always --name princessbot -d princessbot