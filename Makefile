.PHONY: help test build deploy clean

help:
	@echo "Available commands:"
	@echo "  make test          - Run all tests"
	@echo "  make build         - Build Docker images"
	@echo "  make deploy-local  - Deploy to local Kubernetes"
	@echo "  make deploy-prod   - Deploy to production"
	@echo "  make clean         - Clean up resources"
	@echo "  make logs          - View application logs"

test:
	@echo "Running backend tests..."
	cd backend && npm install && npm test
	@echo "Running frontend tests..."
	cd frontend && npm install && npm test

build:
	@echo "Building backend..."
	docker build -t my-backend:v2 ./backend
	@echo "Building frontend..."
	docker build -t my-frontend:v2 ./frontend

deploy-local:
	@./scripts/deploy-local.sh

deploy-prod:
	@./scripts/deploy-production.sh latest

clean:
	@echo "Cleaning up Kubernetes resources..."
	kubectl delete -f k8s/
	@echo "Cleaning up Docker images..."
	docker rmi my-backend:v2 my-frontend:v2 2>/dev/null || true

logs:
	@echo "=== Backend Logs ==="
	kubectl logs -l app=backend --tail=50
	@echo "\n=== Frontend Logs ==="
	kubectl logs -l app=frontend --tail=50
	@echo "\n=== Redis Logs ==="
	kubectl logs -l app=redis --tail=50
	@echo "\n=== PostgreSQL Logs ==="
	kubectl logs -l app=postgres --tail=50

status:
	@echo "=== Pods ==="
	kubectl get pods
	@echo "\n=== Services ==="
	kubectl get services
	@echo "\n=== Deployments ==="
	kubectl get deployments
