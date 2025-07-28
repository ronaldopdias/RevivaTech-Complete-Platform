#!/bin/bash

# RevivaTech Deployment Script
# Usage: ./deploy.sh [environment] [version]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-staging}"
VERSION="${2:-latest}"
DOCKER_REGISTRY="ghcr.io/revivatech"
NAMESPACE="$ENVIRONMENT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validation functions
validate_environment() {
    case "$ENVIRONMENT" in
        development|staging|production)
            log_info "Deploying to $ENVIRONMENT environment"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT. Must be one of: development, staging, production"
            exit 1
            ;;
    esac
}

validate_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Test kubectl connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_success "kubectl connection verified"
}

validate_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Test docker connection
    if ! docker info &> /dev/null; then
        log_error "Cannot connect to Docker daemon"
        exit 1
    fi
    
    log_success "Docker connection verified"
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_warning "Namespace $NAMESPACE does not exist, creating it..."
        kubectl create namespace "$NAMESPACE"
        kubectl label namespace "$NAMESPACE" environment="$ENVIRONMENT"
    fi
    
    # Check if required secrets exist
    local required_secrets=("revivatech-secrets" "ssl-certificates" "github-registry-secret")
    for secret in "${required_secrets[@]}"; do
        if ! kubectl get secret "$secret" -n "$NAMESPACE" &> /dev/null; then
            log_error "Required secret '$secret' not found in namespace '$NAMESPACE'"
            log_info "Please create the secret before deploying"
            exit 1
        fi
    done
    
    # Verify images exist
    local services=("frontend-en" "frontend-pt" "backend")
    for service in "${services[@]}"; do
        local image="$DOCKER_REGISTRY/platform-$service:$VERSION"
        if ! docker manifest inspect "$image" &> /dev/null; then
            log_error "Docker image does not exist: $image"
            exit 1
        fi
    done
    
    log_success "Pre-deployment checks passed"
}

# Build and push images
build_and_push() {
    if [[ "$VERSION" == "latest" ]]; then
        log_info "Building and pushing images..."
        
        local services=("frontend-en" "frontend-pt" "backend")
        for service in "${services[@]}"; do
            log_info "Building $service..."
            
            cd "$PROJECT_ROOT/../$service"
            
            # Build image
            docker build -t "$DOCKER_REGISTRY/platform-$service:$VERSION" .
            
            # Push image
            docker push "$DOCKER_REGISTRY/platform-$service:$VERSION"
            
            log_success "$service image built and pushed"
        done
        
        cd "$PROJECT_ROOT"
    else
        log_info "Using existing images with version: $VERSION"
    fi
}

# Database migration
run_migrations() {
    log_info "Running database migrations..."
    
    # Create migration job
    cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: migration-$VERSION-$(date +%s)
  namespace: $NAMESPACE
  labels:
    app: revivatech
    component: migration
    environment: $ENVIRONMENT
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: migration
        image: $DOCKER_REGISTRY/platform-backend:$VERSION
        command: ["npm", "run", "db:migrate"]
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: revivatech-secrets
              key: database-url
        - name: NODE_ENV
          value: "$ENVIRONMENT"
      imagePullSecrets:
      - name: github-registry-secret
EOF
    
    # Wait for migration to complete
    local job_name=$(kubectl get jobs -n "$NAMESPACE" -l component=migration --sort-by=.metadata.creationTimestamp -o jsonpath='{.items[-1].metadata.name}')
    kubectl wait --for=condition=complete job/"$job_name" -n "$NAMESPACE" --timeout=300s
    
    if kubectl get job "$job_name" -n "$NAMESPACE" -o jsonpath='{.status.conditions[0].type}' | grep -q "Complete"; then
        log_success "Database migration completed"
    else
        log_error "Database migration failed"
        kubectl logs job/"$job_name" -n "$NAMESPACE"
        exit 1
    fi
}

# Deploy application
deploy_application() {
    log_info "Deploying application components..."
    
    local k8s_dir="$PROJECT_ROOT/deployment/k8s/$ENVIRONMENT"
    
    # Export environment variables for envsubst
    export IMAGE_TAG="$VERSION"
    export ENVIRONMENT="$ENVIRONMENT"
    
    # Apply ConfigMaps and Secrets
    kubectl apply -f "$k8s_dir/configmap.yaml"
    
    # Apply PersistentVolumeClaims
    if [[ -f "$k8s_dir/pvc.yaml" ]]; then
        kubectl apply -f "$k8s_dir/pvc.yaml"
    fi
    
    # Apply Services
    if [[ -f "$k8s_dir/services.yaml" ]]; then
        kubectl apply -f "$k8s_dir/services.yaml"
    fi
    
    # Apply Deployments with image substitution
    envsubst < "$k8s_dir/deployments.yaml" | kubectl apply -f -
    
    # Apply Ingress
    if [[ -f "$k8s_dir/ingress.yaml" ]]; then
        kubectl apply -f "$k8s_dir/ingress.yaml"
    fi
    
    # Apply HorizontalPodAutoscalers
    if [[ -f "$k8s_dir/hpa.yaml" ]]; then
        kubectl apply -f "$k8s_dir/hpa.yaml"
    fi
    
    log_success "Application components deployed"
}

# Wait for deployment to complete
wait_for_deployment() {
    log_info "Waiting for deployment to complete..."
    
    local deployments=("frontend-en" "frontend-pt" "backend" "nginx")
    
    for deployment in "${deployments[@]}"; do
        if kubectl get deployment "$deployment" -n "$NAMESPACE" &> /dev/null; then
            log_info "Waiting for $deployment to be ready..."
            kubectl rollout status deployment/"$deployment" -n "$NAMESPACE" --timeout=600s
        fi
    done
    
    log_success "All deployments are ready"
}

# Health checks
run_health_checks() {
    log_info "Running health checks..."
    
    # Wait a bit for services to settle
    sleep 30
    
    # Check if we're in production and use external URLs
    if [[ "$ENVIRONMENT" == "production" ]]; then
        local urls=("https://revivatech.com/health" "https://revivatech.co.uk/health" "https://api.revivatech.com/health")
    else
        # Port-forward for staging/development
        kubectl port-forward service/nginx 8080:80 -n "$NAMESPACE" &
        local port_forward_pid=$!
        sleep 10
        local urls=("http://localhost:8080/health")
    fi
    
    local all_healthy=true
    for url in "${urls[@]}"; do
        if curl -f -s "$url" > /dev/null; then
            log_success "Health check passed: $url"
        else
            log_error "Health check failed: $url"
            all_healthy=false
        fi
    done
    
    # Clean up port-forward if it was started
    if [[ -n "${port_forward_pid:-}" ]]; then
        kill $port_forward_pid 2>/dev/null || true
    fi
    
    if [[ "$all_healthy" == "true" ]]; then
        log_success "All health checks passed"
    else
        log_error "Some health checks failed"
        exit 1
    fi
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    
    local deployments=("frontend-en" "frontend-pt" "backend" "nginx")
    
    for deployment in "${deployments[@]}"; do
        if kubectl get deployment "$deployment" -n "$NAMESPACE" &> /dev/null; then
            kubectl rollout undo deployment/"$deployment" -n "$NAMESPACE"
        fi
    done
    
    wait_for_deployment
    log_success "Rollback completed"
}

# Cleanup old resources
cleanup() {
    log_info "Cleaning up old resources..."
    
    # Clean up old migration jobs
    kubectl delete jobs -n "$NAMESPACE" -l component=migration --field-selector status.successful=1 || true
    
    # Clean up old ReplicaSets
    kubectl delete rs -n "$NAMESPACE" --field-selector status.replicas=0 || true
    
    log_success "Cleanup completed"
}

# Backup function
backup_database() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "Creating database backup before deployment..."
        
        local timestamp=$(date +%Y%m%d-%H%M%S)
        local backup_name="pre-deploy-backup-$timestamp"
        
        # Create backup job
        cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: backup-$timestamp
  namespace: $NAMESPACE
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: backup
        image: postgres:15-alpine
        command: ["sh", "-c"]
        args:
        - |
          pg_dump \$DATABASE_URL > /backup/$backup_name.sql
          aws s3 cp /backup/$backup_name.sql s3://revivatech-backups/database/
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: revivatech-secrets
              key: database-url
        - name: AWS_ACCESS_KEY_ID
          valueFrom:
            secretKeyRef:
              name: revivatech-secrets
              key: aws-access-key-id
        - name: AWS_SECRET_ACCESS_KEY
          valueFrom:
            secretKeyRef:
              name: revivatech-secrets
              key: aws-secret-access-key
        volumeMounts:
        - name: backup-storage
          mountPath: /backup
      volumes:
      - name: backup-storage
        emptyDir: {}
EOF
        
        log_success "Database backup initiated"
    fi
}

# Main deployment function
main() {
    log_info "Starting deployment of RevivaTech platform"
    log_info "Environment: $ENVIRONMENT"
    log_info "Version: $VERSION"
    
    # Validate inputs and environment
    validate_environment
    validate_kubectl
    validate_docker
    
    # Run pre-deployment checks
    pre_deployment_checks
    
    # Create database backup for production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        backup_database
    fi
    
    # Build and push images if needed
    if [[ "$VERSION" == "latest" ]]; then
        build_and_push
    fi
    
    # Run database migrations
    run_migrations
    
    # Deploy application
    deploy_application
    
    # Wait for deployment to complete
    wait_for_deployment
    
    # Run health checks
    if ! run_health_checks; then
        log_error "Health checks failed, initiating rollback..."
        rollback
        exit 1
    fi
    
    # Cleanup old resources
    cleanup
    
    log_success "Deployment completed successfully!"
    log_info "Application is now running in $ENVIRONMENT environment"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "Production URLs:"
        log_info "  - https://revivatech.com"
        log_info "  - https://revivatech.co.uk"
        log_info "  - https://api.revivatech.com"
    fi
}

# Handle script arguments
case "${1:-}" in
    "rollback")
        rollback
        ;;
    "health")
        run_health_checks
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        main
        ;;
esac