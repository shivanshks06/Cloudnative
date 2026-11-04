#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="$ROOT_DIR/terraform"

echo "=================================================="
echo "         CLOUDNATIVE INFRASTRUCTURE DEPLOY"
echo "=================================================="

# 1. Check prerequisite tools
echo "Checking prerequisites..."
for cmd in terraform aws gh; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "Error: '$cmd' is not installed or not in PATH."
    exit 1
  fi
done

# 2. Check AWS and GitHub authentication
echo "Verifying AWS credentials..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
  echo "Error: AWS credentials not configured. Please run 'aws configure'."
  exit 1
fi

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
terraform -chdir="$TF_DIR" apply -auto-approve

# 4. Retrieve outputs
echo ""
echo "Retrieving Terraform outputs..."
EC2_IP="$(terraform -chdir="$TF_DIR" output -raw ec2_public_ip 2>/dev/null || true)"
APP_URL="$(terraform -chdir="$TF_DIR" output -raw app_url 2>/dev/null || true)"

if [ -z "$EC2_IP" ]; then
  echo "Error: Could not retrieve 'ec2_public_ip' from Terraform output."
  exit 1
fi

echo "Elastic IP: $EC2_IP"
echo "App URL:    $APP_URL"

# 5. Update GitHub Secret EC2_HOST
echo ""
echo "Updating GitHub secret 'EC2_HOST'..."
echo "$EC2_IP" | gh secret set EC2_HOST

echo "GitHub secret 'EC2_HOST' successfully updated."

# 6. Trigger CI/CD pipeline
echo ""
echo "Triggering CloudNative CI/CD pipeline..."
gh workflow run ci.yml --ref main

echo ""
echo "=================================================="
echo " Deployment workflow triggered successfully!"
echo " Web App URL: $APP_URL"
echo " View workflow run:"
echo "   gh run list --workflow=ci.yml"
echo "   gh run watch"
echo "=================================================="
