# Git Repository Setup Guide

Complete guide to set up the DataBridge repository with branches, CI/CD, and Airflow integration.

## 🌿 Branch Structure

```
main (production)
  ↑
dev (development)
  ↑
feature/* (feature branches)
```

### Branch Protection Rules

**main (Production)**:
- ✅ Require pull request reviews (2 approvers)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Require conversation resolution
- ✅ Block force pushes
- ✅ Restrict who can push (DevOps only)

**dev (Development)**:
- ✅ Require pull request reviews (1 approver)
- ✅ Require status checks to pass
- ✅ Block force pushes

## 🚀 Initial Setup

### 1. Initialize Repository (if not already done)

```bash
# Clone the repository
git clone https://github.com/your-org/DataBridge.git
cd DataBridge

# Create dev branch
git checkout -b dev
git push -u origin dev

# Return to main
git checkout main
```

### 2. Create Airflow Directory Structure

```bash
# Create directories
mkdir -p airflow/dags
mkdir -p airflow/logs
mkdir -p airflow/plugins
mkdir -p airflow/config

# Create placeholder files
touch airflow/dags/.gitkeep
touch airflow/logs/.gitkeep
touch airflow/plugins/.gitkeep
touch airflow/config/.gitkeep

# Add to git
git add airflow/
git commit -m "feat: add airflow directory structure"
git push origin main
```

### 3. Set Up GitHub Secrets & Variables

Navigate to: **Settings → Secrets and variables → Actions**

#### Required for Production (Secrets tab):

**DataBridge API** (for Airflow DAGs to call DataBridge):
```
DATABRIDGE_API_KEY=<your-secure-api-key>
```

#### Optional Secrets (for advanced features):

**Development Environment**:
```
DEV_AIRFLOW_API_KEY=<dev-api-key>  # If using Airflow API
```

**Production Environment**:
```
PROD_AIRFLOW_API_KEY=<prod-api-key>  # If using Airflow API
```

#### Optional Variables (Variables tab):

**Airflow API URLs** (only if you want automated DAG refresh):
```
DEV_AIRFLOW_API_URL=https://dev-airflow.company.com
PROD_AIRFLOW_API_URL=https://prod-airflow.company.com
```

**Notifications**:
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Note**: The workflow uses **Git-based deployment** by default. Airflow pulls DAGs directly from your GitHub branches:
- `dev` branch → Development Airflow
- `main` branch → Production Airflow

No AWS, S3, or complex deployment required!

### 4. Configure Branch Protection

#### Main Branch Protection:

```bash
# Via GitHub CLI (gh)
gh api repos/:owner/:repo/branches/main/protection -X PUT -f required_status_checks='{"strict":true,"contexts":["validate-dags"]}' -f enforce_admins=true -f required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":true,"required_approving_review_count":2}' -f restrictions=null
```

#### Dev Branch Protection:

```bash
gh api repos/:owner/:repo/branches/dev/protection -X PUT -f required_status_checks='{"strict":true,"contexts":["validate-dags"]}' -f enforce_admins=false -f required_pull_request_reviews='{"required_approving_review_count":1}' -f restrictions=null
```

Or manually via GitHub UI:
1. Go to **Settings → Branches → Add rule**
2. Branch name pattern: `main` or `dev`
3. Enable required settings (see above)

## 📝 Environment Files

### Development (.env.local)

Create `apps/web/.env.local`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/databridge_dev"

# Redis (for BullMQ)
REDIS_URL="redis://localhost:6379"

# Airflow Integration
AIRFLOW_API_URL="http://localhost:8080"
AIRFLOW_API_KEY="dev-airflow-key"

# DataBridge API
DATABRIDGE_API_KEY="dev-databridge-key"
DATABRIDGE_API_URL="http://localhost:3000"

# Feature Flags
ENABLE_AIRFLOW=true
ENABLE_MULTI_PIPELINE=true
```

### Production (.env)

**⚠️ NEVER commit this file! Already in .gitignore**

```bash
# Database
DATABASE_URL="postgresql://user:password@prod-db:5432/databridge_prod"

# Redis
REDIS_URL="redis://prod-redis:6379"

# Airflow Integration
AIRFLOW_API_URL="https://prod-airflow.company.com"
AIRFLOW_API_KEY="${AIRFLOW_API_KEY}" # From secrets manager

# DataBridge API
DATABRIDGE_API_KEY="${DATABRIDGE_API_KEY}" # From secrets manager
DATABRIDGE_API_URL="https://databridge.company.com"
```

## 🔧 Airflow Setup

### 1. Copy Docker Compose to Airflow Directory

```bash
# The docker-compose.yml is generated with DAG download
# Or copy from template:
cp apps/web/src/lib/services/airflow-dag-generator.ts airflow/docker-compose.yml
```

### 2. Start Airflow Locally

```bash
cd airflow
docker-compose up -d

# Wait for services to be ready
docker-compose ps

# Access Airflow UI
open http://localhost:8080
```

### 3. Configure Airflow Connection

```bash
# Option 1: Via CLI
docker-compose exec airflow-webserver airflow connections add 'databridge_api' \
    --conn-type 'http' \
    --conn-host 'host.docker.internal' \
    --conn-port '3000' \
    --conn-schema 'http'

# Option 2: Via UI
# Navigate to Admin → Connections → Add
# Connection Id: databridge_api
# Connection Type: HTTP
# Host: host.docker.internal
# Port: 3000
# Schema: http
```

### 4. Set Airflow Variables

```bash
docker-compose exec airflow-webserver airflow variables set DATABRIDGE_API_KEY "dev-key"
docker-compose exec airflow-webserver airflow variables set DATABRIDGE_API_URL "http://host.docker.internal:3000"
```

## 🏗️ Feature Branch Workflow

### Creating a Feature Branch

```bash
# Start from dev
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/PBI-123-multi-pipeline-ui

# Make changes
git add .
git commit -m "feat: add pipeline management UI"

# Push to remote
git push -u origin feature/PBI-123-multi-pipeline-ui
```

### Creating a Pull Request

1. Go to GitHub repository
2. Click "Pull requests" → "New pull request"
3. Base: `dev` ← Compare: `feature/PBI-123-multi-pipeline-ui`
4. Fill in PR template:

```markdown
## Description
Brief description of changes

## Related PBI
PBI-123: Multi-Pipeline UI

## Type of Change
- [ ] Bug fix
- [x] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [x] Unit tests pass
- [x] Integration tests pass
- [x] Manual testing completed

## Screenshots (if applicable)
[Add screenshots]

## Checklist
- [x] Code follows style guidelines
- [x] Self-review completed
- [x] Documentation updated
- [x] No console.logs or debugging code
```

5. Request reviewers
6. Wait for CI/CD to pass
7. Merge when approved

### Merging Strategy

**Feature → Dev**: Squash and merge
**Dev → Main**: Merge commit (preserves history)

```bash
# After PR approval
git checkout dev
git pull origin dev

# Merge feature (squash)
git merge --squash feature/PBI-123-multi-pipeline-ui
git commit -m "feat: add pipeline management UI (PBI-123)"
git push origin dev

# Clean up feature branch
git branch -d feature/PBI-123-multi-pipeline-ui
git push origin --delete feature/PBI-123-multi-pipeline-ui
```

## 🚀 Deploying to Production

### 1. Merge Dev to Main

```bash
# Ensure dev is up to date
git checkout dev
git pull origin dev

# Create PR from dev to main
gh pr create --base main --head dev --title "Release v1.2.0" --body "Production release"
```

### 2. CI/CD Pipeline Execution

When PR is merged to `main`:
1. ✅ Validates all DAGs
2. ✅ Runs tests
3. ✅ Creates backup
4. ✅ Deploys to production Airflow
5. ✅ Verifies deployment
6. ✅ Creates GitHub release
7. ✅ Sends notifications

### 3. Monitor Deployment

```bash
# Check Airflow UI
open https://prod-airflow.company.com

# Check DataBridge
open https://databridge.company.com

# Check logs
gh run list --workflow=airflow-dag-ci.yml
gh run view <run-id>
```

## 📊 Triggering Pipelines

### Option 1: Via Airflow UI

1. Navigate to http://localhost:8080
2. Find your DAG: `databridge_<project_id>`
3. Click "Trigger DAG" button
4. Monitor execution in real-time

### Option 2: Via Airflow CLI

```bash
# Trigger specific DAG
docker-compose exec airflow-webserver airflow dags trigger databridge_<project_id>

# Trigger with config
docker-compose exec airflow-webserver airflow dags trigger databridge_<project_id> \
    --conf '{"triggered_by": "manual", "priority": "high"}'

# Check status
docker-compose exec airflow-webserver airflow dags list-runs -d databridge_<project_id>
```

### Option 3: Via DataBridge UI

1. Navigate to project pipelines page
2. Click "Execute" on any pipeline
3. Or use "Execute All" for entire project

### Option 4: Via API (Programmatic)

```bash
# Trigger via Airflow API
curl -X POST "http://localhost:8080/api/v1/dags/databridge_<project_id>/dagRuns" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <airflow-api-token>" \
  -d '{
    "conf": {
      "triggered_by": "api",
      "priority": "high"
    }
  }'

# Trigger via DataBridge API
curl -X POST "http://localhost:3000/api/pipelines/<pipeline_id>/execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <databridge-api-key>" \
  -d '{
    "project_id": "<project_id>",
    "triggered_by": "api"
  }'
```

### Option 5: Scheduled (Cron)

DAGs automatically trigger based on schedule:

```python
# In generated DAG
schedule_interval='0 2 * * *'  # Daily at 2 AM UTC
```

Modify schedule in DataBridge:
1. Go to project
2. Edit schedule
3. Regenerate DAG
4. Redeploy

## 🔐 Security Checklist

- [ ] API keys rotated regularly (90 days)
- [ ] Secrets stored in GitHub Secrets (not in code)
- [ ] Branch protection enabled
- [ ] 2FA enabled for all team members
- [ ] SSH keys configured
- [ ] Code review required before merge
- [ ] Production access restricted
- [ ] Audit logs enabled

## 📝 Troubleshooting

### CI/CD Pipeline Fails

```bash
# View logs
gh run list --workflow=airflow-dag-ci.yml
gh run view <run-id> --log

# Common issues:
# 1. Python syntax error → Fix in DAG file
# 2. Missing secrets → Add in GitHub settings
# 3. Connection timeout → Check network/firewall
```

### Airflow Not Starting

```bash
# Check logs
cd airflow
docker-compose logs airflow-webserver
docker-compose logs airflow-scheduler

# Restart services
docker-compose down
docker-compose up -d

# Reset database (⚠️ destroys data)
docker-compose down -v
docker-compose up -d
```

### DAG Not Appearing in Airflow

```bash
# Check DAG location
ls -la airflow/dags/

# Refresh Airflow
docker-compose exec airflow-scheduler airflow dags list

# Check for errors
docker-compose exec airflow-scheduler python airflow/dags/<dag_file>.py
```

## 🆘 Support

For issues:
1. Check this guide
2. Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
3. Check Airflow logs
4. Contact DevOps team

