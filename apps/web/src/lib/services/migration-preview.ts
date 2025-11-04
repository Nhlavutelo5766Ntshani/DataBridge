import postgres from "postgres";
import mssql from "mssql";
import mysql from "mysql2/promise";
import type { SchemaDiscoveryConnection } from "@/lib/types/schema";
import type { TableMapping, ColumnMapping } from "@/db/queries/mappings";
import { applyTransformation } from "@/lib/services/transformation-engine";
import type { TransformationConfig } from "@/lib/types/transformation";

/**
 * Preview row result
 */
export type PreviewRow = {
  sourceData: Record<string, unknown>;
  targetData: Record<string, unknown>;
  transformations: Record<string, string>;
};

/**
 * Migration preview result
 */
export type MigrationPreview = {
  tableName: string;
  sourceTable: string;
  targetTable: string;
  sampleRows: PreviewRow[];
  totalSourceRows: number;
  warnings: string[];
};

/**
 * Generate migration preview with sample data
 * @param sourceConnection - Source database connection
 * @param tableMapping - Table mapping configuration
 * @param columnMappings - Column mappings
 * @param sampleSize - Number of rows to preview (default 10)
 * @returns Migration preview
 */
export async function generateMigrationPreview(
  sourceConnection: SchemaDiscoveryConnection,
  tableMapping: TableMapping,
  columnMappings: ColumnMapping[],
  sampleSize = 10
): Promise<MigrationPreview> {
  const sampleRows: PreviewRow[] = [];
  
  const sourceData = await fetchSampleData(
    sourceConnection,
    tableMapping.sourceTable,
    sampleSize
  );
  
  const totalSourceRows = await getTableRowCount(
    sourceConnection,
    tableMapping.sourceTable
  );
  
  const excludedColumns = columnMappings
    .filter(cm => {
      const config = cm.transformationConfig as TransformationConfig | null;
      return config?.type === "EXCLUDE_COLUMN";
    })
    .map(cm => cm.sourceColumn);

  for (const sourceRow of sourceData) {
    const targetRow: Record<string, unknown> = {};
    const transformations: Record<string, string> = {};
    
    for (const columnMapping of columnMappings) {
      const sourceValue = sourceRow[columnMapping.sourceColumn];
      const config = columnMapping.transformationConfig as TransformationConfig | null;
      
      if (config?.type === "EXCLUDE_COLUMN") {
        transformations[columnMapping.sourceColumn] = "EXCLUDED";
        continue;
      }
      
      let transformedValue = sourceValue;
      let transformationDesc = "Direct copy";
      
      if (config) {
        transformedValue = applyTransformation(sourceValue, config);
        transformationDesc = getTransformationDescription(config);
      }
      
      targetRow[columnMapping.targetColumn] = transformedValue;
      transformations[columnMapping.sourceColumn] = transformationDesc;
    }
    
    sampleRows.push({
      sourceData: sourceRow,
      targetData: targetRow,
      transformations,
    });
  }
  
  const warnings: string[] = [];
  
  if (excludedColumns.length > 0) {
    warnings.push(`${excludedColumns.length} columns will be excluded from migration`);
  }
  
  const unmappedSourceColumns = Object.keys(sourceData[0] || {}).filter(
    col => !columnMappings.some(cm => cm.sourceColumn === col)
  );
  
  if (unmappedSourceColumns.length > 0) {
    warnings.push(
      `${unmappedSourceColumns.length} source columns have no mapping: ${unmappedSourceColumns.join(", ")}`
    );
  }
  
  return {
    tableName: tableMapping.sourceTable,
    sourceTable: tableMapping.sourceTable,
    targetTable: tableMapping.targetTable,
    sampleRows,
    totalSourceRows,
    warnings,
  };
}

/**
 * Fetch sample data from source table
 * @param connection - Database connection
 * @param tableName - Table name
 * @param limit - Number of rows to fetch
 * @returns Array of row data
 */
async function fetchSampleData(
  connection: SchemaDiscoveryConnection,
  tableName: string,
  limit: number
): Promise<Record<string, unknown>[]> {
  const dbType = connection.dbType.toLowerCase();

  switch (dbType) {
    case "postgresql":
      return await fetchPostgreSQLData(connection, tableName, limit);
    case "sqlserver":
      return await fetchSQLServerData(connection, tableName, limit);
    case "mysql":
      return await fetchMySQLData(connection, tableName, limit);
    case "mongodb":
      return [];
    case "couchdb":
      return [];
    default:
      throw new Error(`Unsupported database type: ${connection.dbType}`);
  }
}

/**
 * Fetch data from PostgreSQL
 * @param connection - PostgreSQL connection
 * @param tableName - Table name
 * @param limit - Number of rows
 * @returns Array of rows
 */
async function fetchPostgreSQLData(
  connection: SchemaDiscoveryConnection,
  tableName: string,
  limit: number
): Promise<Record<string, unknown>[]> {
  const connectionString = `postgresql://${connection.username}:${connection.password}@${connection.host}:${connection.port}/${connection.database}`;
  const sql = postgres(connectionString, {
    max: 1,
    connect_timeout: 10,
  });

  try {
    const rows = await sql`SELECT * FROM ${sql(tableName)} LIMIT ${limit}`;
    await sql.end();
    return rows as Record<string, unknown>[];
  } catch (error) {
    await sql.end();
    throw error;
  }
}

/**
 * Fetch data from SQL Server
 * @param connection - SQL Server connection
 * @param tableName - Table name
 * @param limit - Number of rows
 * @returns Array of rows
 */
async function fetchSQLServerData(
  connection: SchemaDiscoveryConnection,
  tableName: string,
  limit: number
): Promise<Record<string, unknown>[]> {
  const config: mssql.config = {
    server: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.username,
    password: connection.password,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      connectTimeout: 10000,
    },
  };

  const pool = await mssql.connect(config);

  try {
    const result = await pool
      .request()
      .query(`SELECT TOP ${limit} * FROM ${tableName}`);
    
    await pool.close();
    return result.recordset as Record<string, unknown>[];
  } catch (error) {
    await pool.close();
    throw error;
  }
}

/**
 * Fetch data from MySQL
 * @param connection - MySQL connection
 * @param tableName - Table name
 * @param limit - Number of rows
 * @returns Array of rows
 */
async function fetchMySQLData(
  connection: SchemaDiscoveryConnection,
  tableName: string,
  limit: number
): Promise<Record<string, unknown>[]> {
  const mysqlConnection = await mysql.createConnection({
    host: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.username,
    password: connection.password,
    connectTimeout: 10000,
  });

  try {
    const [rows] = await mysqlConnection.query(
      `SELECT * FROM ${tableName} LIMIT ?`,
      [limit]
    );
    
    await mysqlConnection.end();
    return rows as Record<string, unknown>[];
  } catch (error) {
    await mysqlConnection.end();
    throw error;
  }
}

/**
 * Get total row count for a table
 * @param connection - Database connection
 * @param tableName - Table name
 * @returns Row count
 */
async function getTableRowCount(
  connection: SchemaDiscoveryConnection,
  tableName: string
): Promise<number> {
  const dbType = connection.dbType.toLowerCase();

  switch (dbType) {
    case "postgresql":
      return await getPostgreSQLRowCount(connection, tableName);
    case "sqlserver":
      return await getSQLServerRowCount(connection, tableName);
    case "mysql":
      return await getMySQLRowCount(connection, tableName);
    default:
      return 0;
  }
}

/**
 * Get row count from PostgreSQL
 * @param connection - PostgreSQL connection
 * @param tableName - Table name
 * @returns Row count
 */
async function getPostgreSQLRowCount(
  connection: SchemaDiscoveryConnection,
  tableName: string
): Promise<number> {
  const connectionString = `postgresql://${connection.username}:${connection.password}@${connection.host}:${connection.port}/${connection.database}`;
  const sql = postgres(connectionString, {
    max: 1,
    connect_timeout: 10,
  });

  try {
    const result = await sql`SELECT COUNT(*) as count FROM ${sql(tableName)}`;
    await sql.end();
    return Number(result[0].count);
  } catch (error) {
    await sql.end();
    return 0;
  }
}

/**
 * Get row count from SQL Server
 * @param connection - SQL Server connection
 * @param tableName - Table name
 * @returns Row count
 */
async function getSQLServerRowCount(
  connection: SchemaDiscoveryConnection,
  tableName: string
): Promise<number> {
  const config: mssql.config = {
    server: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.username,
    password: connection.password,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      connectTimeout: 10000,
    },
  };

  const pool = await mssql.connect(config);

  try {
    const result = await pool
      .request()
      .query(`SELECT COUNT(*) as count FROM ${tableName}`);
    
    await pool.close();
    return result.recordset[0].count;
  } catch (error) {
    await pool.close();
    return 0;
  }
}

/**
 * Get row count from MySQL
 * @param connection - MySQL connection
 * @param tableName - Table name
 * @returns Row count
 */
async function getMySQLRowCount(
  connection: SchemaDiscoveryConnection,
  tableName: string
): Promise<number> {
  const mysqlConnection = await mysql.createConnection({
    host: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.username,
    password: connection.password,
    connectTimeout: 10000,
  });

  try {
    const [rows] = await mysqlConnection.query(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    
    await mysqlConnection.end();
    const result = rows as { count: number }[];
    return result[0].count;
  } catch (error) {
    await mysqlConnection.end();
    return 0;
  }
}

/**
 * Get human-readable description of transformation
 * @param config - Transformation configuration
 * @returns Description string
 */
function getTransformationDescription(config: TransformationConfig): string {
  switch (config.type) {
    case "TYPE_CONVERSION":
      return `Convert to ${config.parameters.targetType}`;
    case "CUSTOM_SQL":
      return `Custom SQL: ${config.parameters.expression}`;
    case "EXCLUDE_COLUMN":
      return "Excluded from migration";
    case "DEFAULT_VALUE":
      return `Default: ${config.parameters.value}`;
    case "UPPERCASE":
      return "Convert to uppercase";
    case "LOWERCASE":
      return "Convert to lowercase";
    case "TRIM":
      return "Trim whitespace";
    default:
      return "Direct copy";
  }
}

