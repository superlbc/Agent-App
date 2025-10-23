#!/bin/bash
IMAGE_NAME="nginx-cors"
REGISTRY_URL="us-east4-docker.pkg.dev/mom-ai-apps/momentum-meeting-notes"
REPOSITORY="${REGISTRY_URL}/${IMAGE_NAME}"

TAG_LATEST="${REPOSITORY}:latest"

echo "Building Docker image with tags: ${TAG_LATEST}"
docker build -t "${TAG_LATEST}" .

echo "Pushing images to registry"
docker push "${REPOSITORY}" --all-tags

echo "Docker image built and pushed successfully."

