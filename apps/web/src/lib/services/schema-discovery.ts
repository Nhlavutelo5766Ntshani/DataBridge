import postgres from "postgres";
import mssql from "mssql";
import mysql from "mysql2/promise";
import { MongoClient } from "mongodb";
import nano from "nano";
import type { DatabaseSchema, SchemaDiscoveryConnection } from "@/lib/types/schema";

/**
 * Discover database schema based on connection type
 * @param connection - Database connection details
 * @returns Database schema with tables and columns
 */
export async function discoverDatabaseSchema(
  connection: SchemaDiscoveryConnection
): Promise<DatabaseSchema> {
  const dbType = connection.dbType.toLowerCase();

  switch (dbType) {
    case "postgresql":
      return await discoverPostgreSQLSchema(connection);
    case "sqlserver":
      return await discoverSQLServerSchema(connection);
    case "mysql":
      return await discoverMySQLSchema(connection);
    case "mongodb":
      return await discoverMongoDBSchema(connection);
    case "couchdb":
      return await discoverCouchDBSchema(connection);
    default:
      throw new Error(`Unsupported database type: ${connection.dbType}`);
  }
}

/**
 * Discover PostgreSQL database schema
 * @param connection - PostgreSQL connection details
 * @returns Database schema
 */
async function discoverPostgreSQLSchema(
  connection: SchemaDiscoveryConnection
): Promise<DatabaseSchema> {
  const connectionString = `postgresql://${connection.username}:${connection.password}@${connection.host}:${connection.port}/${connection.database}`;
  const sql = postgres(connectionString, {
    max: 1,
    connect_timeout: 10,
  });

  try {
    const tables = await sql`
      SELECT 
        t.table_name,
        t.table_schema,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.character_maximum_length,
        c.column_default,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
      FROM information_schema.tables t
      JOIN information_schema.columns c 
        ON t.table_name = c.table_name 
        AND t.table_schema = c.table_schema
      LEFT JOIN (
        SELECT ku.table_schema, ku.table_name, ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku
          ON tc.constraint_name = ku.constraint_name
          AND tc.table_schema = ku.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
      ) pk ON c.table_name = pk.table_name 
        AND c.table_schema = pk.table_schema
        AND c.column_name = pk.column_name
      WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name, c.ordinal_position
    `;

    await sql.end();

    const tableMap = new Map<string, any>();
    
    for (const row of tables) {
      if (!tableMap.has(row.table_name)) {
        tableMap.set(row.table_name, {
          name: row.table_name,
          schema: row.table_schema,
          columns: [],
        });
      }
      
      tableMap.get(row.table_name).columns.push({
        name: row.column_name,
        dataType: row.data_type,
        isNullable: row.is_nullable === "YES",
        isPrimaryKey: row.is_primary_key,
        maxLength: row.character_maximum_length,
        defaultValue: row.column_default,
      });
    }

    return {
      tables: Array.from(tableMap.values()),
      databaseType: "PostgreSQL",
      databaseName: connection.database,
    };
  } catch (error) {
    await sql.end();
    throw error;
  }
}

/**
 * Discover SQL Server database schema
 * @param connection - SQL Server connection details
 * @returns Database schema
 */
async function discoverSQLServerSchema(
  connection: SchemaDiscoveryConnection
): Promise<DatabaseSchema> {
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
    const result = await pool.request().query(`
      SELECT 
        t.TABLE_NAME,
        t.TABLE_SCHEMA,
        c.COLUMN_NAME,
        c.DATA_TYPE,
        c.IS_NULLABLE,
        c.CHARACTER_MAXIMUM_LENGTH,
        c.COLUMN_DEFAULT,
        CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END AS IS_PRIMARY_KEY
      FROM INFORMATION_SCHEMA.TABLES t
      JOIN INFORMATION_SCHEMA.COLUMNS c 
        ON t.TABLE_NAME = c.TABLE_NAME 
        AND t.TABLE_SCHEMA = c.TABLE_SCHEMA
      LEFT JOIN (
        SELECT ku.TABLE_SCHEMA, ku.TABLE_NAME, ku.COLUMN_NAME
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
          ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
          AND tc.TABLE_SCHEMA = ku.TABLE_SCHEMA
        WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
      ) pk ON c.TABLE_NAME = pk.TABLE_NAME 
        AND c.TABLE_SCHEMA = pk.TABLE_SCHEMA
        AND c.COLUMN_NAME = pk.COLUMN_NAME
      WHERE t.TABLE_TYPE = 'BASE TABLE'
        AND t.TABLE_SCHEMA = 'dbo'
      ORDER BY t.TABLE_NAME, c.ORDINAL_POSITION
    `);

    await pool.close();

    const tableMap = new Map<string, any>();
    
    for (const row of result.recordset) {
      if (!tableMap.has(row.TABLE_NAME)) {
        tableMap.set(row.TABLE_NAME, {
          name: row.TABLE_NAME,
          schema: row.TABLE_SCHEMA,
          columns: [],
        });
      }
      
      tableMap.get(row.TABLE_NAME).columns.push({
        name: row.COLUMN_NAME,
        dataType: row.DATA_TYPE,
        isNullable: row.IS_NULLABLE === "YES",
        isPrimaryKey: row.IS_PRIMARY_KEY === 1,
        maxLength: row.CHARACTER_MAXIMUM_LENGTH,
        defaultValue: row.COLUMN_DEFAULT,
      });
    }

    return {
      tables: Array.from(tableMap.values()),
      databaseType: "SQL Server",
      databaseName: connection.database,
    };
  } catch (error) {
    await pool.close();
    throw error;
  }
}

/**
 * Discover MySQL database schema
 * @param connection - MySQL connection details
 * @returns Database schema
 */
async function discoverMySQLSchema(
  connection: SchemaDiscoveryConnection
): Promise<DatabaseSchema> {
  const mysqlConnection = await mysql.createConnection({
    host: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.username,
    password: connection.password,
    connectTimeout: 10000,
  });

  try {
    const [tables] = await mysqlConnection.query(`
      SELECT 
        t.TABLE_NAME,
        t.TABLE_SCHEMA,
        c.COLUMN_NAME,
        c.DATA_TYPE,
        c.IS_NULLABLE,
        c.CHARACTER_MAXIMUM_LENGTH,
        c.COLUMN_DEFAULT,
        CASE WHEN k.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END AS IS_PRIMARY_KEY
      FROM INFORMATION_SCHEMA.TABLES t
      JOIN INFORMATION_SCHEMA.COLUMNS c 
        ON t.TABLE_NAME = c.TABLE_NAME 
        AND t.TABLE_SCHEMA = c.TABLE_SCHEMA
      LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
        ON c.TABLE_NAME = k.TABLE_NAME
        AND c.TABLE_SCHEMA = k.TABLE_SCHEMA
        AND c.COLUMN_NAME = k.COLUMN_NAME
        AND k.CONSTRAINT_NAME = 'PRIMARY'
      WHERE t.TABLE_SCHEMA = ?
        AND t.TABLE_TYPE = 'BASE TABLE'
      ORDER BY t.TABLE_NAME, c.ORDINAL_POSITION
    `, [connection.database]);

    await mysqlConnection.end();

    const tableMap = new Map<string, any>();
    const rows = tables as any[];
    
    for (const row of rows) {
      if (!tableMap.has(row.TABLE_NAME)) {
        tableMap.set(row.TABLE_NAME, {
          name: row.TABLE_NAME,
          schema: row.TABLE_SCHEMA,
          columns: [],
        });
      }
      
      tableMap.get(row.TABLE_NAME).columns.push({
        name: row.COLUMN_NAME,
        dataType: row.DATA_TYPE,
        isNullable: row.IS_NULLABLE === "YES",
        isPrimaryKey: row.IS_PRIMARY_KEY === 1,
        maxLength: row.CHARACTER_MAXIMUM_LENGTH,
        defaultValue: row.COLUMN_DEFAULT,
      });
    }

    return {
      tables: Array.from(tableMap.values()),
      databaseType: "MySQL",
      databaseName: connection.database,
    };
  } catch (error) {
    await mysqlConnection.end();
    throw error;
  }
}

/**
 * Discover MongoDB database schema
 * @param connection - MongoDB connection details
 * @returns Database schema
 */
async function discoverMongoDBSchema(
  connection: SchemaDiscoveryConnection
): Promise<DatabaseSchema> {
  const uri = `mongodb://${connection.username}:${connection.password}@${connection.host}:${connection.port}/${connection.database}`;
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    await client.connect();
    const db = client.db(connection.database);
    
    const collections = await db.listCollections().toArray();
    const tables = [];

    for (const collection of collections) {
      const sampleDoc = await db.collection(collection.name).findOne();
      
      const columns = sampleDoc
        ? Object.keys(sampleDoc).map(key => ({
            name: key,
            dataType: typeof sampleDoc[key],
            isNullable: true,
            isPrimaryKey: key === "_id",
            maxLength: null,
            defaultValue: null,
          }))
        : [];

      tables.push({
        name: collection.name,
        columns,
      });
    }

    await client.close();

    return {
      tables,
      databaseType: "MongoDB",
      databaseName: connection.database,
    };
  } catch (error) {
    await client.close();
    throw error;
  }
}

/**
 * Discover CouchDB database schema
 * @param connection - CouchDB connection details
 * @returns Database schema
 */
async function discoverCouchDBSchema(
  connection: SchemaDiscoveryConnection
): Promise<DatabaseSchema> {
  const url = `http://${connection.username}:${connection.password}@${connection.host}:${connection.port}`;
  const client = nano(url);

  try {
    await client.db.get(connection.database);
    const db = client.use(connection.database);
    
    const allDocs = await db.list({ limit: 1, include_docs: true });
    
    const columns = allDocs.rows.length > 0 && allDocs.rows[0].doc
      ? Object.keys(allDocs.rows[0].doc).map(key => ({
          name: key,
          dataType: typeof (allDocs.rows[0].doc as any)[key],
          isNullable: true,
          isPrimaryKey: key === "_id",
          maxLength: null,
          defaultValue: null,
        }))
      : [];

    return {
      tables: [{
        name: connection.database,
        columns,
      }],
      databaseType: "CouchDB",
      databaseName: connection.database,
    };
  } catch (error) {
    throw error;
  }
}

