import { pipelines, mappingProjects, schedules } from "@databridge/schema";

type Pipeline = typeof pipelines.$inferSelect;
type Project = typeof mappingProjects.$inferSelect;
type Schedule = typeof schedules.$inferSelect;

type DagGenerationInput = {
  project: Project;
  pipelines: Pipeline[];
  schedule?: Schedule | null;
};

/**
 * Generates an Airflow DAG Python file for a multi-pipeline project
 */
export function generateAirflowDAG(input: DagGenerationInput): string {
  const { project, pipelines: projectPipelines, schedule } = input;
  
  const dagId = `databridge_${project.id.replace(/-/g, "_")}`;
  const sortedPipelines = [...projectPipelines].sort((a, b) => a.pipelineOrder - b.pipelineOrder);
  
  const pythonDAG = `"""
Airflow DAG for DataBridge Project: ${project.name}
Generated automatically by DataBridge
Project ID: ${project.id}
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.http.operators.http import SimpleHttpOperator
from airflow.operators.empty import EmptyOperator
import os

# Default arguments for the DAG
default_args = {
    'owner': 'databridge',
    'depends_on_past': False,
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'execution_timeout': timedelta(hours=2),
}

# DAG definition
dag = DAG(
    dag_id='${dagId}',
    default_args=default_args,
    description='${project.description?.replace(/'/g, "\\'") || "DataBridge ETL Pipeline"}',
    schedule_interval='${schedule?.cronExpression || "@daily"}',
    start_date=datetime(${new Date().getFullYear()}, ${new Date().getMonth() + 1}, ${new Date().getDate()}),
    catchup=False,
    tags=['databridge', 'etl', 'multi-pipeline', 'project-${project.id}'],
    max_active_runs=1,
)

# Environment variables
DATABRIDGE_API_URL = os.getenv('DATABRIDGE_API_URL', 'http://localhost:3000')
DATABRIDGE_API_KEY = os.getenv('DATABRIDGE_API_KEY', '')

# Start task
start = EmptyOperator(
    task_id='start',
    dag=dag,
)

# End task
end = EmptyOperator(
    task_id='end',
    dag=dag,
)

${sortedPipelines.map((pipeline, index) => {
  const taskId = `pipeline_${pipeline.id.replace(/-/g, "_")}`;

  return `
# Task ${index + 1}: ${pipeline.name}
${taskId} = SimpleHttpOperator(
    task_id='${taskId}',
    method='POST',
    http_conn_id='databridge_api',
    endpoint='/api/pipelines/${pipeline.id}/execute',
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {DATABRIDGE_API_KEY}',
    },
    data='''{
        "project_id": "${project.id}",
        "pipeline_id": "${pipeline.id}",
        "triggered_by": "airflow"
    }''',
    response_check=lambda response: response.json().get('success', False),
    log_response=True,
    dag=dag,
)`;
}).join('\n')}

# Define task dependencies
${sortedPipelines.map((pipeline, index) => {
  const taskId = `pipeline_${pipeline.id.replace(/-/g, "_")}`;
  
  if (index === 0) {
    return `start >> ${taskId}`;
  } else if (pipeline.dependsOnPipelineId) {
    const prevTaskId = `pipeline_${pipeline.dependsOnPipelineId.replace(/-/g, "_")}`;
    return `${prevTaskId} >> ${taskId}`;
  } else {
    return `start >> ${taskId}`;
  }
}).join('\n')}

# Connect last pipeline to end
${sortedPipelines.length > 0 
  ? `pipeline_${sortedPipelines[sortedPipelines.length - 1].id.replace(/-/g, "_")} >> end`
  : 'start >> end'}
`;

  return pythonDAG;
}

/**
 * Generates a README file for the Airflow DAG
 */
export function generateDAGReadme(input: DagGenerationInput): string {
  const { project, pipelines: projectPipelines, schedule } = input;
  
  return `# Airflow DAG: ${project.name}

## Project Information
- **Project ID**: ${project.id}
- **Description**: ${project.description || "N/A"}
- **Strategy**: ${project.strategy || "single"}
- **Schedule**: ${schedule?.cronExpression || "@daily"} (${schedule?.timezone || "UTC"})

## Pipelines
${projectPipelines.sort((a, b) => a.pipelineOrder - b.pipelineOrder).map((p, i) => `
${i + 1}. **${p.name}** (Order: ${p.pipelineOrder})
   - ID: ${p.id}
   - Description: ${p.description || "N/A"}
   - Status: ${p.status || "draft"}
   ${p.dependsOnPipelineId ? `- Depends on: ${projectPipelines.find(pp => pp.id === p.dependsOnPipelineId)?.name || "Unknown"}` : ""}
`).join("\n")}

## Setup Instructions

### 1. Configure Airflow Connection
\`\`\`bash
# Add DataBridge API connection to Airflow
airflow connections add 'databridge_api' \\
    --conn-type 'http' \\
    --conn-host 'localhost' \\
    --conn-port '3000' \\
    --conn-schema 'http'
\`\`\`

### 2. Set Environment Variables
\`\`\`bash
export DATABRIDGE_API_URL="http://localhost:3000"
export DATABRIDGE_API_KEY="your-api-key-here"
\`\`\`

### 3. Deploy DAG
Copy the generated DAG file to your Airflow DAGs folder:
\`\`\`bash
cp databridge_${project.id.replace(/-/g, "_")}.py $AIRFLOW_HOME/dags/
\`\`\`

### 4. Trigger the DAG
\`\`\`bash
# Via CLI
airflow dags trigger databridge_${project.id.replace(/-/g, "_")}

# Via Web UI
Navigate to http://localhost:8080 and enable/trigger the DAG
\`\`\`

## Monitoring
- View logs in Airflow UI: http://localhost:8080
- Check execution status in DataBridge: http://localhost:3000/projects/${project.id}/pipelines

## Troubleshooting
- Ensure DATABRIDGE_API_KEY is set correctly
- Verify network connectivity between Airflow and DataBridge
- Check Airflow connection configuration
- Review task logs for detailed error messages

## Generated
Generated on: ${new Date().toISOString()}
Generated by: DataBridge Airflow DAG Generator
`;
}

/**
 * Generates Airflow requirements.txt for the DAG
 */
export function generateAirflowRequirements(): string {
  return `# Airflow requirements for DataBridge integration
apache-airflow==2.8.0
apache-airflow-providers-http==4.7.0
requests==2.31.0
python-dotenv==1.0.0
`;
}

/**
 * Generates a Docker Compose file for local Airflow development
 */
export function generateAirflowDockerCompose(): string {
  return `version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: airflow
      POSTGRES_PASSWORD: airflow
      POSTGRES_DB: airflow
    volumes:
      - postgres-db-volume:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "airflow"]
      interval: 5s
      retries: 5
    restart: always

  redis:
    image: redis:latest
    expose:
      - 6379
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 30s
      retries: 50
    restart: always

  airflow-webserver:
    image: apache/airflow:2.8.0-python3.11
    command: webserver
    ports:
      - "8080:8080"
    environment:
      AIRFLOW__CORE__EXECUTOR: CeleryExecutor
      AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://airflow:airflow@postgres/airflow
      AIRFLOW__CELERY__RESULT_BACKEND: db+postgresql://airflow:airflow@postgres/airflow
      AIRFLOW__CELERY__BROKER_URL: redis://:@redis:6379/0
      AIRFLOW__CORE__FERNET_KEY: ''
      AIRFLOW__CORE__DAGS_ARE_PAUSED_AT_CREATION: 'true'
      AIRFLOW__CORE__LOAD_EXAMPLES: 'false'
      AIRFLOW__API__AUTH_BACKENDS: 'airflow.api.auth.backend.basic_auth'
      AIRFLOW__WEBSERVER__SECRET_KEY: 'databridge-secret-key'
      DATABRIDGE_API_URL: http://host.docker.internal:3000
      DATABRIDGE_API_KEY: \${DATABRIDGE_API_KEY}
    volumes:
      - ./airflow/dags:/opt/airflow/dags
      - ./airflow/logs:/opt/airflow/logs
      - ./airflow/plugins:/opt/airflow/plugins
      - ./airflow/config:/opt/airflow/config
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "curl", "--fail", "http://localhost:8080/health"]
      interval: 10s
      timeout: 10s
      retries: 5
    restart: always

  airflow-scheduler:
    image: apache/airflow:2.8.0-python3.11
    command: scheduler
    environment:
      AIRFLOW__CORE__EXECUTOR: CeleryExecutor
      AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://airflow:airflow@postgres/airflow
      AIRFLOW__CELERY__RESULT_BACKEND: db+postgresql://airflow:airflow@postgres/airflow
      AIRFLOW__CELERY__BROKER_URL: redis://:@redis:6379/0
      AIRFLOW__CORE__FERNET_KEY: ''
      AIRFLOW__CORE__DAGS_ARE_PAUSED_AT_CREATION: 'true'
      AIRFLOW__CORE__LOAD_EXAMPLES: 'false'
      DATABRIDGE_API_URL: http://host.docker.internal:3000
      DATABRIDGE_API_KEY: \${DATABRIDGE_API_KEY}
    volumes:
      - ./airflow/dags:/opt/airflow/dags
      - ./airflow/logs:/opt/airflow/logs
      - ./airflow/plugins:/opt/airflow/plugins
      - ./airflow/config:/opt/airflow/config
    depends_on:
      - postgres
      - redis
    restart: always

  airflow-worker:
    image: apache/airflow:2.8.0-python3.11
    command: celery worker
    environment:
      AIRFLOW__CORE__EXECUTOR: CeleryExecutor
      AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://airflow:airflow@postgres/airflow
      AIRFLOW__CELERY__RESULT_BACKEND: db+postgresql://airflow:airflow@postgres/airflow
      AIRFLOW__CELERY__BROKER_URL: redis://:@redis:6379/0
      AIRFLOW__CORE__FERNET_KEY: ''
      DATABRIDGE_API_URL: http://host.docker.internal:3000
      DATABRIDGE_API_KEY: \${DATABRIDGE_API_KEY}
    volumes:
      - ./airflow/dags:/opt/airflow/dags
      - ./airflow/logs:/opt/airflow/logs
      - ./airflow/plugins:/opt/airflow/plugins
      - ./airflow/config:/opt/airflow/config
    depends_on:
      - postgres
      - redis
    restart: always

  airflow-init:
    image: apache/airflow:2.8.0-python3.11
    entrypoint: /bin/bash
    command:
      - -c
      - |
        mkdir -p /sources/logs /sources/dags /sources/plugins
        chown -R 50000:0 /sources/{logs,dags,plugins}
        airflow db init
        airflow users create \\
          --username admin \\
          --firstname Admin \\
          --lastname User \\
          --role Admin \\
          --email admin@databridge.local \\
          --password admin
    environment:
      AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://airflow:airflow@postgres/airflow
    volumes:
      - ./airflow:/sources
    depends_on:
      - postgres

volumes:
  postgres-db-volume:

networks:
  default:
    name: databridge_airflow
`;
}

