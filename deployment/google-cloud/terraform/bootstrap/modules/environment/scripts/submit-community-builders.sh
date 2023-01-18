#!/bin/bash

PROJECT=$1

# Create temporary workspace
mkdir "$PROJECT"
cd "$PROJECT" || exit 1

# https://cloud.google.com/build/docs/configuring-builds/use-community-and-custom-builders

git clone https://github.com/GoogleCloudPlatform/cloud-builders-community.git

# zip

pushd cloud-builders-community/zip || exit 1

gcloud builds submit --project "$PROJECT" .

popd || exit 1

# Remove temporary workspace
cd ..
rm -rf "$PROJECT"
