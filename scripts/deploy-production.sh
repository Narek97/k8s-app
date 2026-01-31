#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./deploy-production.sh <version>"
    exit 1
fi

VERSION=$1
DOCKER_USERNAME=${DOCKER_USERNAME:-"yourusername"}

echo "🚀 Deploying version $VERSION to Production..."

# Pull images
echo "📥 Pulling Docker images..."
docker pull $DOCKER_USERNAME/fullstack-backend:$VERSION
docker pull $DOCKER_USERNAME/fullstack-frontend:$VERSION

# Update manifests with new version
echo "📝 Updating Kubernetes manifests..."
sed -i.bak "s|image: .*fullstack-backend.*|image: $DOCKER_USERNAME/fullstack-backend:$VERSION|g" k8s/backend.yaml
sed -i.bak "s|image: .*fullstack-frontend.*|image: $DOCKER_USERNAME/fullstack-frontend:$VERSION|g" k8s/frontend.yaml
sed -i.bak "s|imagePullPolicy: Never|imagePullPolicy: Always|g" k8s/backend.yaml
sed -i.bak "s|imagePullPolicy: Never|imagePullPolicy: Always|g" k8s/frontend.yaml

# Apply updates
echo "☸️  Applying Kubernetes updates..."
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml

# Watch rollout
echo "⏳ Watching rollout..."
kubectl rollout status deployment/backend
kubectl rollout status deployment/frontend

echo "✅ Deployment complete!"
kubectl get pods
