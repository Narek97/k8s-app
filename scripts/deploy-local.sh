#!/bin/bash

echo "🚀 Deploying to Local Kubernetes..."

# Build images
echo "📦 Building Docker images..."
docker build -t my-backend:v2 ./backend
docker build -t my-frontend:v2 ./frontend

# Apply Kubernetes configs
echo "☸️  Applying Kubernetes configurations..."
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
sleep 5
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml

# Wait for deployments
echo "⏳ Waiting for deployments..."
kubectl wait --for=condition=available --timeout=120s deployment/postgres
kubectl wait --for=condition=available --timeout=120s deployment/redis
kubectl wait --for=condition=available --timeout=120s deployment/backend
kubectl wait --for=condition=available --timeout=120s deployment/frontend

echo "✅ Deployment complete!"
echo "🌐 Frontend: http://localhost:30300"
echo "🔌 Backend: http://localhost:30500"
