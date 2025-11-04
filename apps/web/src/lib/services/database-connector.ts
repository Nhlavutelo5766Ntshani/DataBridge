import { connections } from "@databridge/schema";
import { Pool as PostgreSQLPool } from "pg";
import mysql from "mysql2/promise";
import sql from "mssql";
import { MongoClient } from "mongodb";
import nano from "nano";

type Connection = typeof connections.$inferSelect;

type DatabaseClient = PostgreSQLPool | mysql.Connection | sql.ConnectionPool | MongoClient | nano.ServerScope;

/**
 * Creates a database connection with connection pooling
 * Supports: PostgreSQL, MySQL, SQL Server, MongoDB, CouchDB
 */
export async function createDatabaseConnection(
  connection: Connection
): Promise<DatabaseClient> {
  const { dbType, host, port, database, username, encryptedPassword } = connection;
  
  const password = decryptPassword(encryptedPassword);

  switch (dbType) {
    case "postgresql":
      return await createPostgreSQLConnection(host, port, database, username, password);
    
    case "mysql":
      return await createMySQLConnection(host, port, database, username, password);
    
    case "sqlserver":
      return await createSQLServerConnection(host, port, database, username, password);
    
    case "mongodb":
      return await createMongoDBConnection(host, port, database, username, password);
    
    case "couchdb":
      return createCouchDBConnection(host, port, username, password);
    
    default:
      throw new Error(`Unsupported database type: ${dbType}`);
  }
}

/**
 * Closes a database connection
 */
export async function closeDatabaseConnection(
  client: DatabaseClient
): Promise<void> {
  try {
    if (client instanceof PostgreSQLPool) {
      await client.end();
    } else if ("end" in client && typeof client.end === "function") {
      await client.end();
    } else if ("close" in client && typeof client.close === "function") {
      await client.close();
    }
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
}

/**
 * PostgreSQL connection with connection pooling
 */
async function createPostgreSQLConnection(
  host: string,
  port: number,
  database: string,
  username: string,
  password: string
): Promise<PostgreSQLPool> {
  const pool = new PostgreSQLPool({
    host,
    port,
    database,
    user: username,
    password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  return pool;
}

/**
 * MySQL connection with connection pooling
 */
async function createMySQLConnection(
  host: string,
  port: number,
  database: string,
  username: string,
  password: string
): Promise<mysql.Connection> {
  const connection = await mysql.createConnection({
    host,
    port,
    database,
    user: username,
    password,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

  return connection;
}

/**
 * SQL Server connection with connection pooling
 */
async function createSQLServerConnection(
  host: string,
  port: number,
  database: string,
  username: string,
  password: string
): Promise<sql.ConnectionPool> {
  const pool = new sql.ConnectionPool({
    server: host,
    port,
    database,
    user: username,
    password,
    options: {
      encrypt: true,
      trustServerCertificate: true,
      enableArithAbort: true,
    },
    pool: {
      max: 20,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    requestTimeout: 300000,
  });

  await pool.connect();
  return pool;
}

/**
 * MongoDB connection with connection pooling
 */
async function createMongoDBConnection(
  host: string,
  port: number,
  database: string,
  username: string,
  password: string
): Promise<MongoClient> {
  const uri = `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=admin`;
  
  const client = new MongoClient(uri, {
    maxPoolSize: 20,
    minPoolSize: 5,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 300000,
  });

  await client.connect();
  return client;
}

/**
 * CouchDB connection
 */
function createCouchDBConnection(
  host: string,
  port: number,
  username: string,
  password: string
): nano.ServerScope {
  const url = `http://${username}:${password}@${host}:${port}`;
  return nano(url);
}

/**
 * Decrypts password from database
 * In production, this would use proper encryption (e.g., pgcrypto, AWS KMS)
 * For now, passwords are stored as-is (encryption to be implemented)
 */
function decryptPassword(encryptedPassword: string): string {
  return encryptedPassword;
}

/**
 * Tests a database connection
 */
export async function testDatabaseConnection(
  connection: Connection
): Promise<{ success: boolean; error?: string }> {
  let client: DatabaseClient | null = null;
  
  try {
    client = await createDatabaseConnection(connection);
    
    switch (connection.dbType) {
      case "postgresql":
        await (client as PostgreSQLPool).query("SELECT 1");
        break;
      case "mysql":
        await (client as mysql.Connection).query("SELECT 1");
        break;
      case "sqlserver":
        await (client as sql.ConnectionPool).request().query("SELECT 1");
        break;
      case "mongodb":
        await (client as MongoClient).db().admin().ping();
        break;
      case "couchdb":
        await (client as nano.ServerScope).db.list();
        break;
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  } finally {
    if (client) {
      await closeDatabaseConnection(client);
    }
  }
}

