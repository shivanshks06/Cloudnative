$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $PSScriptRoot
$TfDir = Join-Path $RootDir "terraform"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "         CLOUDNATIVE INFRASTRUCTURE DEPLOY" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Check prerequisite tools
Write-Host "Checking prerequisites..."
$requiredCommands = @("terraform", "gh")
foreach ($cmd in $requiredCommands) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Error "Error: '$cmd' is not installed or not in PATH."
        exit 1
    }
}

# 2. Check GitHub CLI authentication
Write-Host "Verifying GitHub CLI authentication..."
try {
    gh auth status | Out-Null
} catch {
    Write-Error "Error: GitHub CLI is not authenticated. Please run 'gh auth login'."
    exit 1
}

# 3. Initialize and apply Terraform
Write-Host "`nInitializing Terraform in $TfDir..." -ForegroundColor Yellow
terraform -chdir="$TfDir" init

Write-Host "`nApplying Terraform configuration..." -ForegroundColor Yellow
terraform -chdir="$TfDir" apply -auto-approve -lock=false

# 4. Retrieve outputs
Write-Host "`nRetrieving Terraform outputs..."
$ec2Ip = (terraform -chdir="$TfDir" output -raw ec2_public_ip).Trim()
$appUrl = (terraform -chdir="$TfDir" output -raw app_url).Trim()

if (-not $ec2Ip) {
    Write-Error "Error: Could not retrieve 'ec2_public_ip' from Terraform output."
    exit 1
}

Write-Host "Elastic IP: $ec2Ip" -ForegroundColor Green
Write-Host "App URL:    $appUrl" -ForegroundColor Green

# 5. Update GitHub Secret EC2_HOST
Write-Host "`nUpdating GitHub secret 'EC2_HOST'..." -ForegroundColor Yellow
gh secret set EC2_HOST --body $ec2Ip

Write-Host "GitHub secret 'EC2_HOST' successfully updated." -ForegroundColor Green

# 6. Trigger CI/CD pipeline
Write-Host "`nTriggering CloudNative CI/CD pipeline..." -ForegroundColor Yellow
gh workflow run ci.yml --ref main

Write-Host "`nWaiting for CI/CD workflow to register..."
Start-Sleep -Seconds 5

try {
    $ciRunId = (gh run list --workflow=ci.yml --limit 1 --json databaseId --jq '.[0].databaseId')
    if ($ciRunId) {
        Write-Host "Watching CI/CD Pipeline (Run #$ciRunId)..." -ForegroundColor Yellow
        gh run watch $ciRunId
    }
} catch {
    Write-Host "Could not watch CI run." -ForegroundColor DarkGray
}

Write-Host "`nWaiting for EC2 Deployment to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

try {
    $deployRunId = (gh run list --workflow=deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId')
    if ($deployRunId) {
        Write-Host "Watching EC2 Deployment (Run #$deployRunId)..." -ForegroundColor Yellow
        gh run watch $deployRunId
    }
} catch {
    Write-Host "Could not watch Deployment run." -ForegroundColor DarkGray
}

Write-Host "`nVerifying application availability at $appUrl..." -ForegroundColor Yellow
for ($i = 1; $i -le 12; $i++) {
    try {
        $response = Invoke-WebRequest -Uri $appUrl -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "Application is online! (HTTP 200)" -ForegroundColor Green
            break
        }
    } catch {}
    Write-Host "Waiting for web server to respond (attempt $i/12)..."
    Start-Sleep -Seconds 5
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host " CloudNative deployment complete!" -ForegroundColor Green
Write-Host " Web App URL: $appUrl" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
