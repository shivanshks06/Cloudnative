#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="$ROOT_DIR/terraform"

echo "=================================================="
echo "         CLOUDNATIVE INFRASTRUCTURE DEPLOY"
echo "=================================================="

# 1. Check prerequisite tools
echo "Checking prerequisites..."
for cmd in terraform gh; do
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

# 3. Initialize and apply Terraform
echo ""
echo "Initializing Terraform in $TF_DIR..."
terraform -chdir="$TF_DIR" init

echo ""
echo "Applying Terraform configuration..."
terraform -chdir="$TF_DIR" apply -auto-approve -lock=false

# 4. Retrieve outputs
echo ""
echo "Retrieving Terraform outputs..."
EC2_IP="$(terraform -chdir="$TF_DIR" output -raw ec2_public_ip 2>/dev/null || true)"
APP_URL="$(terraform -chdir="$TF_DIR" output -raw app_url 2>/dev/null || true)"
INSTANCE_ID="$(terraform -chdir="$TF_DIR" output -raw ec2_instance_id 2>/dev/null || true)"

if [ -z "$EC2_IP" ] || [ -z "$INSTANCE_ID" ]; then
  echo "Error: Could not retrieve outputs from Terraform."
  exit 1
fi

echo "Instance ID: $INSTANCE_ID"
echo "Elastic IP:  $EC2_IP"
echo "App URL:     $APP_URL"

# 5. Update GitHub Secrets and Variables
echo ""
echo "Updating GitHub secret 'EC2_HOST'..."
echo "$EC2_IP" | gh secret set EC2_HOST

echo "Updating GitHub variables 'EC2_INSTANCE_ID' and 'APP_URL'..."
REPO="repos/$(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null || echo 'shivanshks06/Cloudnative')"
gh api -X POST "/$REPO/actions/variables" -f name="EC2_INSTANCE_ID" -f value="$INSTANCE_ID" 2>/dev/null || \
  gh api -X PATCH "/$REPO/actions/variables/EC2_INSTANCE_ID" -f name="EC2_INSTANCE_ID" -f value="$INSTANCE_ID"

gh api -X POST "/$REPO/actions/variables" -f name="APP_URL" -f value="$APP_URL" 2>/dev/null || \
  gh api -X PATCH "/$REPO/actions/variables/APP_URL" -f name="APP_URL" -f value="$APP_URL"

echo "GitHub configuration successfully updated."

# 6. Trigger CI/CD pipeline
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
sleep 8
DEPLOY_RUN_ID="$(gh run list --workflow=deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || true)"
if [ -n "$DEPLOY_RUN_ID" ]; then
  echo "Watching EC2 Deployment (Run #$DEPLOY_RUN_ID)..."
  gh run watch "$DEPLOY_RUN_ID" || true
fi

echo ""
echo "Verifying application availability at $APP_URL..."
for attempt in $(seq 1 12); do
  HTTP_STATUS="$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" 2>/dev/null || true)"
  if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "304" ]; then
    echo "Application is online! (HTTP $HTTP_STATUS)"
    break
  fi
  echo "Waiting for web server to respond (attempt $attempt/12)..."
  sleep 5
done

echo ""
echo "=================================================="
echo " CloudNative deployment complete!"
echo " Web App URL: $APP_URL"
echo "=================================================="
