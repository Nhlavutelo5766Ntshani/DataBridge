# DataBridge Airflow Integration

Production-ready Apache Airflow integration for DataBridge multi-pipeline ETL orchestration.

## 📁 Directory Structure

```
airflow/
├── dags/                   # Airflow DAG files (auto-generated from DataBridge)
├── logs/                   # Airflow execution logs
├── plugins/                # Custom Airflow plugins
├── config/                 # Airflow configuration files
└── docker-compose.yml      # Local development setup
```

## 🚀 Quick Start

### Local Development

1. **Start Airflow locally**:
```bash
cd airflow
docker-compose up -d
```

2. **Access Airflow UI**:
- URL: http://localhost:8080
- Username: `admin`
- Password: `admin`

3. **Configure DataBridge connection**:
```bash
airflow connections add 'databridge_api' \
    --conn-type 'http' \
    --conn-host 'localhost' \
    --conn-port '3000' \
    --conn-schema 'http'
```

4. **Set environment variables**:
```bash
export DATABRIDGE_API_URL="http://localhost:3000"
export DATABRIDGE_API_KEY="your-api-key"
```

## 📦 Generating DAGs

DAGs are automatically generated from DataBridge multi-pipeline projects:

1. Create a multi-pipeline project in DataBridge
2. Add pipelines with dependencies
3. Click "Generate Airflow DAG"
4. Download the ZIP file containing:
   - `databridge_<project_id>.py` - The DAG file
   - `README_<project_id>.md` - Project documentation
   - `requirements.txt` - Python dependencies
   - `docker-compose.yml` - Local Airflow setup

5. Copy the DAG file to `airflow/dags/`

## 🔧 Configuration

### Environment Variables

Required for production:
- `DATABRIDGE_API_URL` - DataBridge API endpoint
- `DATABRIDGE_API_KEY` - API authentication key
- `AIRFLOW__DATABASE__SQL_ALCHEMY_CONN` - Airflow metadata database
- `AIRFLOW__CELERY__BROKER_URL` - Redis/RabbitMQ for Celery
- `AIRFLOW__CELERY__RESULT_BACKEND` - Celery result backend

### Secrets Management

**Development**: Set via `.env` file
**Production**: Use AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault

```python
# Example: Fetch secrets in DAG
from airflow.hooks.base import BaseHook

conn = BaseHook.get_connection('databridge_api')
api_key = conn.password
```

## 🔐 API Authentication

All DAG tasks authenticate with DataBridge using Bearer tokens:

```python
headers={
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {DATABRIDGE_API_KEY}',
}
```

Generate API keys in DataBridge Settings → API Keys.

## 📊 Monitoring

### Airflow UI
- **DAG Runs**: http://localhost:8080/dags
- **Task Logs**: Click on task → View Log
- **Gantt Chart**: Visualize pipeline execution timeline

### DataBridge UI
- **Pipeline Executions**: http://localhost:3000/projects/{id}/pipelines
- **Real-time Progress**: Live updates during execution
- **Execution History**: View past runs and statistics

## 🚦 CI/CD Pipeline

GitHub Actions workflow validates and deploys DAGs:

### Validation (PR & Push)
- ✅ Code formatting (Black, isort)
- ✅ Linting (pylint)
- ✅ Type checking (mypy)
- ✅ DAG syntax validation
- ✅ Cycle detection
- ✅ Unit tests

### Deployment

**Development** (`dev` branch):
- Auto-deploys on push
- No manual approval required

**Production** (`main` branch):
- Requires manual approval
- Creates backup before deployment
- Verifies deployment
- Creates GitHub release

## 🏗️ Architecture

### High-Level Flow

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│  DataBridge │─────►│    Airflow   │─────►│  Target System  │
│   (Orch)    │      │   (Executor) │      │  (Data Lake)    │
└─────────────┘      └──────────────┘      └─────────────────┘
       │                     │
       │                     │
       ▼                     ▼
┌─────────────┐      ┌──────────────┐
│  PostgreSQL │      │  BullMQ/Redis│
│  (Metadata) │      │  (Job Queue) │
└─────────────┘      └──────────────┘
```

### Responsibilities

**Airflow**:
- High-level workflow orchestration
- Scheduling (cron expressions)
- Dependency management between pipelines
- Retry logic and error handling
- SLA monitoring

**DataBridge**:
- Low-level ETL execution
- Data extraction, transformation, loading
- Column mapping and transformations
- Connection pooling
- Progress tracking

**BullMQ**:
- Asynchronous job processing
- Batch data processing
- Background worker tasks

## 🔄 Pipeline Execution Flow

1. **Airflow schedules DAG** based on cron expression
2. **Airflow calls DataBridge API** (`POST /api/pipelines/{id}/execute`)
3. **DataBridge validates** pipeline and connections
4. **DataBridge executes ETL**:
   - Extract data from source (batch processing)
   - Apply transformations (type conversion, custom SQL)
   - Load to target (bulk insert)
5. **DataBridge returns result** to Airflow
6. **Airflow proceeds** to next pipeline (if dependent)

## 📝 Example DAG

```python
from airflow import DAG
from airflow.operators.http import SimpleHttpOperator
from datetime import datetime

dag = DAG(
    'databridge_staging_to_prod',
    schedule_interval='0 2 * * *',  # Daily at 2 AM
    start_date=datetime(2025, 1, 1),
)

# Pipeline 1: Source → Staging
ingest_to_staging = SimpleHttpOperator(
    task_id='ingest_to_staging',
    http_conn_id='databridge_api',
    endpoint='/api/pipelines/{pipeline_id}/execute',
    method='POST',
    dag=dag,
)

# Pipeline 2: Staging → Production
transform_to_prod = SimpleHttpOperator(
    task_id='transform_to_prod',
    http_conn_id='databridge_api',
    endpoint='/api/pipelines/{pipeline_id}/execute',
    method='POST',
    dag=dag,
)

# Define dependencies
ingest_to_staging >> transform_to_prod
```

## 🐛 Troubleshooting

### DAG not appearing in UI
- Check file is in `airflow/dags/` directory
- Verify no Python syntax errors
- Check Airflow logs: `docker-compose logs airflow-scheduler`

### Task failing with 401 Unauthorized
- Verify `DATABRIDGE_API_KEY` is set correctly
- Check API key is active in DataBridge
- Ensure connection ID matches in DAG

### Slow task execution
- Check connection pooling settings
- Verify batch size configuration
- Monitor database query performance
- Check network latency between Airflow and DataBridge

## 📚 Resources

- [Apache Airflow Documentation](https://airflow.apache.org/docs/)
- [DataBridge Documentation](../docs/)
- [GitHub Actions Workflow](.github/workflows/airflow-dag-ci.yml)

## 🤝 Support

For issues or questions:
1. Check [troubleshooting guide](#-troubleshooting)
2. Review Airflow task logs
3. Check DataBridge execution logs
4. Contact DevOps team

