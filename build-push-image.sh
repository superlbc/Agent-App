#!/bin/bash
IMAGE_NAME="momentum-meeting-notes"
REGISTRY_URL="us-east4-docker.pkg.dev/mom-ai-apps/momentum-meeting-notes"
REPOSITORY="${REGISTRY_URL}/${IMAGE_NAME}"

TAG_LATEST="${REPOSITORY}:latest"

echo "Building Docker image with tags: ${TAG_LATEST}"
docker build -t "${TAG_LATEST}" .

echo "========================================="
echo "Building Backend Docker Image"
echo "========================================="
echo "Image: ${IMAGE_NAME}"
echo "Tags: ${TAG_HASH}, ${TAG_LATEST}"
echo "========================================="

echo "Pushing images to registry"
docker push "${REPOSITORY}" --all-tags

echo ""
echo "========================================="
echo "✅ Success!"
echo "========================================="
echo "Docker image built and pushed successfully"
echo ""
echo "To deploy to Cloud Run:"
echo "  gcloud run deploy note-crafter-frontend \\"
echo "    --image ${TAG_HASH} \\"
echo "    --platform managed \\"
echo "    --region us-east4 \\"
echo "========================================="
