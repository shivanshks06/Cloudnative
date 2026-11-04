$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $PSScriptRoot
$TfDir = Join-Path $RootDir "terraform"

Write-Host "==================================================" -ForegroundColor Red
Write-Host "        CLOUDNATIVE INFRASTRUCTURE DESTROY" -ForegroundColor Red
Write-Host "==================================================" -ForegroundColor Red
Write-Host "WARNING: This will destroy all AWS resources managed" -ForegroundColor Yellow
Write-Host "by Terraform (EC2 instance, Elastic IP, VPC, etc.)." -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Red

# Check prerequisites
if (-not (Get-Command terraform -ErrorAction SilentlyContinue)) {
    Write-Error "Error: 'terraform' is not installed or not in PATH."
    exit 1
}

# Confirm destruction
$confirmation = Read-Host "Type 'DESTROY' to confirm teardown"

if ($confirmation -ne "DESTROY") {
    Write-Host "Destruction cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host "`nDestroying CloudNative AWS infrastructure..." -ForegroundColor Red
terraform -chdir="$TfDir" destroy -auto-approve -lock=false

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host " All CloudNative AWS resources have been destroyed." -ForegroundColor Green
Write-Host " Elastic IP released to avoid unnecessary AWS costs." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
