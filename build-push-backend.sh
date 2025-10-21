#!/bin/bash

# ==============================================================================
# Build and Push Backend Docker Image to Google Artifact Registry
# ==============================================================================
#
# This script builds the Note Crafter backend Docker image and pushes it
# to Google Cloud Artifact Registry.
#
# Prerequisites:
# - Docker installed and running
# - gcloud CLI installed and authenticated
# - Docker configured for Artifact Registry (run: gcloud auth configure-docker us-east4-docker.pkg.dev)
# ==============================================================================

set -e  # Exit on error

# Configuration
IMAGE_NAME="note-crafter-backend"
GIT_HASH=$(git rev-parse --short HEAD)
REGISTRY_URL="us-east4-docker.pkg.dev/mom-ai-apps/note-crafter"
REPOSITORY="${REGISTRY_URL}/${IMAGE_NAME}"

TAG_HASH="${REPOSITORY}:${GIT_HASH}"
TAG_LATEST="${REPOSITORY}:latest"

echo "========================================="
echo "Building Backend Docker Image"
echo "========================================="
echo "Image: ${IMAGE_NAME}"
echo "Git Hash: ${GIT_HASH}"
echo "Tags: ${TAG_HASH}, ${TAG_LATEST}"
echo "========================================="

# Build the Docker image (from backend directory)
echo ""
echo "Building Docker image..."
cd backend
docker build -t "${TAG_HASH}" -t "${TAG_LATEST}" .
cd ..

echo ""
echo "========================================="
echo "Pushing Images to Registry"
echo "========================================="

# Push both tags to registry
docker push "${REPOSITORY}" --all-tags

echo ""
echo "========================================="
echo "✅ Success!"
echo "========================================="
echo "Backend image built and pushed successfully"
echo "Git hash: ${GIT_HASH}"
echo ""
echo "To deploy to Cloud Run:"
echo "  gcloud run deploy note-crafter-backend \\"
echo "    --image ${TAG_HASH} \\"
echo "    --platform managed \\"
echo "    --region us-east4 \\"
echo "    --set-env-vars CLIENT_ID=YourClientID,CLIENT_SECRET=YourClientSecret \\"
echo "    --no-allow-unauthenticated"
echo ""
echo "Note: Backend should have private/internal access only"
echo "========================================="
