#!/bin/bash

PROJECT=$1

# Create temporary workspace
mkdir "$PROJECT"
cd "$PROJECT" || exit 1

# https://cloud.google.com/build/docs/configuring-builds/use-community-and-custom-builders

git clone https://github.com/GoogleCloudPlatform/cloud-builders-community.git

# terraform
pushd cloud-builders-community/terraform || exit 1

gcloud builds submit --project "$PROJECT" --substitutions=_TERRAFORM_VERSION="1.3.7",_TERRAFORM_VERSION_SHA256SUM="b8cf184dee15dfa89713fe56085313ab23db22e17284a9a27c0999c67ce3021e" .

popd || exit 1

# zip
pushd cloud-builders-community/zip || exit 1

gcloud builds submit --project "$PROJECT" .

popd || exit 1

# Remove temporary workspace
cd ..
rm -rf "$PROJECT"
