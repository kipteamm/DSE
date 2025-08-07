#!/bin/bash

git pull

GEN_DIR="project/static/gen"

if [[ -d "$GEN_DIR" ]]; then
    echo "Clearing $GEN_DIR..."
    rm -rf "$GEN_DIR"/*
else
    echo "Error: $GEN_DIR does not exist"
    exit 1
fi

echo "Rebuilding assets..."
flask assets build
