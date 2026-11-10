#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <previous-commit-sha>"
  exit 1
fi

IMAGE_TAG="$1"

if [[ ! "$IMAGE_TAG" =~ ^[a-f0-9]{7,40}$ ]]; then
  echo "Invalid commit SHA"
  exit 1
fi

cd /opt/cloudnative
ENV_FILE=".env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Production environment file missing"
  exit 1
fi

echo "Rolling back application images to: $IMAGE_TAG"

# Preserve every other production environment variable.
if grep -q '^IMAGE_TAG=' "$ENV_FILE"; then
  sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$IMAGE_TAG/" "$ENV_FILE"
else
  printf '\nIMAGE_TAG=%s\n' "$IMAGE_TAG" >> "$ENV_FILE"
fi

docker compose pull backend frontend
docker compose up -d --no-deps backend frontend

echo "Current container status:"
docker compose ps

echo "Rollback image tag applied: $IMAGE_TAG"

