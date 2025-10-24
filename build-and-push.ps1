# Run command "./build-and-push.ps1"

# Variables
$IMAGE_NAME = "momentum-meeting-notes"
$REGISTRY_URL = "us-east4-docker.pkg.dev/mom-ai-apps/momentum-meeting-notes-generator"
$REPOSITORY = "$REGISTRY_URL/$IMAGE_NAME"
$TAG_LATEST = "${REPOSITORY}:latest"

Write-Host "Building Docker image with tags: $TAG_LATEST" -ForegroundColor Green
docker build -t "$TAG_LATEST" .

Write-Host "Pushing images to registry" -ForegroundColor Green
docker push "$TAG_LATEST"

Write-Host "Docker image built and pushed successfully." -ForegroundColor Green
echo ""
echo "========================================="
echo "✅ Success!"
echo "========================================="
echo "Docker image built and pushed successfully"
echo ""
echo "To deploy to Cloud Run:"
echo "  gcloud run deploy note-crafter-frontend \\"
echo "    --image: ${TAG_LATEST} \\"
echo "    --url: ${REGISTRY_URL} \\"
echo "    --region: us-east4 \\"
echo "========================================="
