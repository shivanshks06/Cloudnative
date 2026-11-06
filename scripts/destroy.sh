#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="$ROOT_DIR/terraform"

echo "=================================================="
echo "        CLOUDNATIVE INFRASTRUCTURE DESTROY"
echo "=================================================="
echo "WARNING: This will destroy all AWS resources managed"
echo "by Terraform (EC2 instance, Elastic IP, VPC, etc.)."
echo "=================================================="

# Check prerequisites
for cmd in terraform; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "Error: '$cmd' is not installed or not in PATH."
    exit 1
  fi
done

# Confirm destruction
read -r -p "Type 'DESTROY' to confirm teardown: " CONFIRMATION || true
CONFIRMATION="$(echo "${CONFIRMATION:-}" | tr -d '\r"' | xargs)"

if [ "$CONFIRMATION" != "DESTROY" ]; then
  echo "Destruction cancelled."
  exit 0
fi

echo ""
echo "Destroying CloudNative AWS infrastructure..."
terraform -chdir="$TF_DIR" destroy -auto-approve -lock=false

echo ""
echo "=================================================="
echo " All CloudNative AWS resources have been destroyed."
echo " Elastic IP released to avoid unnecessary AWS costs."
echo "=================================================="
echo "To restore everything at any time, simply run:"
echo "  ./scripts/apply.sh"
echo "=================================================="
