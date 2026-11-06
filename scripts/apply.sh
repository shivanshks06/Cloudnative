#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="$ROOT_DIR/terraform"

echo "=================================================="
echo "         CLOUDNATIVE INFRASTRUCTURE DEPLOY"
echo "=================================================="

# 1. Check prerequisite tools
echo "Checking prerequisites..."
for cmd in terraform gh aws curl; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "Error: '$cmd' is not installed or not in PATH."
    exit 1
  fi
done

# 2. Check GitHub CLI authentication
echo "Verifying GitHub CLI authentication..."
if ! gh auth status > /dev/null 2>&1; then
  echo "Error: GitHub CLI is not authenticated. Please run 'gh auth login'."
  exit 1
fi

# 3. Check AWS CLI credentials
echo "Verifying AWS credentials..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
  echo "Warning: Default AWS profile not configured. Checking --profile cloudnative..."
  if aws sts get-caller-identity --profile cloudnative > /dev/null 2>&1; then
    export AWS_PROFILE="cloudnative"
    echo "Using AWS profile: cloudnative"
  else
    echo "Error: Could not verify AWS credentials. Run 'aws configure' or check credentials."
    exit 1
  fi
fi

# 4. Initialize and apply Terraform
echo ""
echo "Initializing Terraform in $TF_DIR..."
terraform -chdir="$TF_DIR" init

echo ""
echo "Applying Terraform configuration..."
terraform -chdir="$TF_DIR" apply -auto-approve -lock=false

# 5. Retrieve outputs
echo ""
echo "Retrieving Terraform outputs..."
EC2_IP="$(terraform -chdir="$TF_DIR" output -raw ec2_public_ip 2>/dev/null || true)"
APP_URL="$(terraform -chdir="$TF_DIR" output -raw app_url 2>/dev/null || true)"
GRAFANA_URL="$(terraform -chdir="$TF_DIR" output -raw grafana_url 2>/dev/null || echo "http://$EC2_IP:3000")"
PROMETHEUS_URL="$(terraform -chdir="$TF_DIR" output -raw prometheus_url 2>/dev/null || echo "http://$EC2_IP:9090")"
INSTANCE_ID="$(terraform -chdir="$TF_DIR" output -raw ec2_instance_id 2>/dev/null || true)"
ROLE_ARN="$(terraform -chdir="$TF_DIR" output -raw github_actions_role_arn 2>/dev/null || true)"

if [ -z "$EC2_IP" ] || [ -z "$INSTANCE_ID" ]; then
  echo "Error: Could not retrieve outputs from Terraform."
  exit 1
fi

echo "Instance ID:    $INSTANCE_ID"
echo "Elastic IP:     $EC2_IP"
echo "App URL:        $APP_URL"
echo "Grafana URL:    $GRAFANA_URL"
echo "Prometheus URL: $PROMETHEUS_URL"

# 6. Update GitHub Secrets and Variables
echo ""
echo "Updating GitHub secrets and variables..."
echo "$EC2_IP" | gh secret set EC2_HOST

REPO="repos/$(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null || echo 'shivanshks06/Cloudnative')"

gh api -X POST "/$REPO/actions/variables" -f name="EC2_INSTANCE_ID" -f value="$INSTANCE_ID" 2>/dev/null || \
  gh api -X PATCH "/$REPO/actions/variables/EC2_INSTANCE_ID" -f name="EC2_INSTANCE_ID" -f value="$INSTANCE_ID"

gh api -X POST "/$REPO/actions/variables" -f name="APP_URL" -f value="$APP_URL" 2>/dev/null || \
  gh api -X PATCH "/$REPO/actions/variables/APP_URL" -f name="APP_URL" -f value="$APP_URL"

if [ -n "$ROLE_ARN" ]; then
  gh api -X POST "/$REPO/actions/variables" -f name="AWS_ROLE_ARN" -f value="$ROLE_ARN" 2>/dev/null || \
    gh api -X PATCH "/$REPO/actions/variables/AWS_ROLE_ARN" -f name="AWS_ROLE_ARN" -f value="$ROLE_ARN"
fi

echo "GitHub configuration successfully updated."

# 7. Wait for EC2 instance to come Online in AWS Systems Manager
echo ""
echo "Waiting for EC2 instance ($INSTANCE_ID) to come Online in AWS Systems Manager..."
SSM_ONLINE=false
for attempt in $(seq 1 30); do
  STATUS="$(aws ssm describe-instance-information \
    --filters "Key=InstanceIds,Values=$INSTANCE_ID" \
    --region ap-south-1 \
    --query "InstanceInformationList[0].PingStatus" \
    --output text 2>/dev/null || true)"
  if [ "$STATUS" = "Online" ]; then
    echo "EC2 instance is Online in AWS Systems Manager!"
    SSM_ONLINE=true
    break
  fi
  echo "Waiting for SSM Agent to report Online (attempt $attempt/30)..."
  sleep 10
done

if [ "$SSM_ONLINE" != "true" ]; then
  echo "Warning: EC2 instance is not yet Online in SSM. Deployment may take longer or retry."
fi

# 8. Trigger CI/CD pipeline
echo ""
echo "Triggering CloudNative CI/CD pipeline..."
gh workflow run ci.yml --ref main

echo "Waiting for CI/CD workflow to register..."
sleep 5

CI_RUN_ID="$(gh run list --workflow=ci.yml --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || true)"
if [ -n "$CI_RUN_ID" ]; then
  echo "Watching CI/CD Pipeline (Run #$CI_RUN_ID)..."
  gh run watch "$CI_RUN_ID" || true
fi

echo ""
echo "Waiting for EC2 Deployment to start..."
sleep 10
DEPLOY_RUN_ID="$(gh run list --workflow=deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || true)"
if [ -n "$DEPLOY_RUN_ID" ]; then
  echo "Watching EC2 Deployment (Run #$DEPLOY_RUN_ID)..."
  gh run watch "$DEPLOY_RUN_ID" || true
fi

# 9. Verify services
echo ""
echo "Verifying application availability at $APP_URL..."
for attempt in $(seq 1 20); do
  HTTP_STATUS="$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/health" 2>/dev/null || true)"
  if [ "$HTTP_STATUS" = "200" ]; then
    echo "CloudNative API is healthy! (HTTP $HTTP_STATUS)"
    break
  fi
  echo "Waiting for backend health check (attempt $attempt/20)..."
  sleep 6
done

echo ""
echo "=================================================="
echo " CloudNative Deployment Complete!"
echo "=================================================="
echo " Web Application: $APP_URL"
echo " Backend Health:  $APP_URL/api/health"
echo " Grafana:         $GRAFANA_URL"
echo " Prometheus:      $PROMETHEUS_URL"
echo " Targets:         $PROMETHEUS_URL/targets"
echo "=================================================="
