"use server";

import { QueryResponse } from "@/db/types/queries";
import { ERROR_CODES } from "@/lib/constants/error-codes";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import postgres from "postgres";
import sql from "mssql";
import mysql from "mysql2/promise";
import { MongoClient } from "mongodb";
import nano from "nano";

type ConnectionTestParams = {
  dbType: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  sslMode?: string;
};

/**
 * Test database connection with provided credentials
 * @param params - Connection parameters
 * @returns Success or error response
 */
export async function testDatabaseConnection(
  params: ConnectionTestParams
): Promise<QueryResponse<{ message: string }>> {
  try {
    logger.info("Testing database connection", { dbType: params.dbType, host: params.host, port: params.port });
    
    const { dbType, host, port, database, username, password } = params;
    const normalizedType = dbType.toLowerCase();

    if (normalizedType === "postgresql") {
      return await testPostgreSQL(host, port, database, username, password);
    }

    if (normalizedType === "sqlserver") {
      return await testSQLServer(host, port, database, username, password);
    }

    if (normalizedType === "mysql") {
      return await testMySQL(host, port, database, username, password);
    }

    if (normalizedType === "mongodb") {
      return await testMongoDB(host, port, database, username, password);
    }

    if (normalizedType === "couchdb") {
      return await testCouchDB(host, port, database, username, password);
    }

    if (normalizedType === "oracle") {
      return {
        success: false,
        data: null,
        error: "Oracle database connections are not yet supported. Supported types: PostgreSQL, MySQL, SQL Server, MongoDB, CouchDB.",
        code: ERROR_CODES.INVALID_FORMAT,
      };
    }

    return {
      success: false,
      data: null,
      error: `Unsupported database type: ${dbType}. Supported types: PostgreSQL, MySQL, SQL Server, MongoDB, CouchDB.`,
      code: ERROR_CODES.INVALID_FORMAT,
    };
  } catch (error) {
    logger.error("Connection test failed - outer catch", { error, params });
    
    if (error instanceof Error) {
      return {
        success: false,
        data: null,
        error: `Connection test failed: ${error.message}`,
        code: ERROR_CODES.DB_ERROR,
      };
    }
    
    return {
      success: false,
      data: null,
      error: "An unexpected error occurred while testing the connection. Please check the server logs.",
      code: ERROR_CODES.DB_ERROR,
    };
  }
}

/**
 * Test PostgreSQL database connection
 * @param host - Database host
 * @param port - Database port
 * @param database - Database name
 * @param username - Username for authentication
 * @param password - Password for authentication
 * @returns Success or error response
 */
async function testPostgreSQL(
  host: string,
  port: number,
  database: string,
  username: string,
  password: string
): Promise<QueryResponse<{ message: string }>> {
  const connectionString = `postgresql://${username}:${password}@${host}:${port}/${database}`;
  const client = postgres(connectionString, {
    max: 1,
    connect_timeout: 10,
    ssl: 'prefer',
  });

  try {
    await client`SELECT 1 as test`;
    await client.end();
    
    return createSuccessResponse({
      message: "PostgreSQL connection successful!",
    });
  } catch (error: unknown) {
    await client.end();
    
    if (error instanceof Error) {
      if (error.message.includes("password authentication failed")) {
        return {
          success: false,
          data: null,
          error: "Authentication failed. Please check your username and password.",
          code: ERROR_CODES.PERMISSION_DENIED,
        };
      }
      
      if (error.message.includes("ECONNREFUSED")) {
        return {
          success: false,
          data: null,
          error: "Connection refused. Please check the host and port.",
          code: ERROR_CODES.CONNECTION_FAILED,
        };
      }
      
      if (error.message.includes("database") && error.message.includes("does not exist")) {
        return {
          success: false,
          data: null,
          error: "Database does not exist. Please check the database name.",
          code: ERROR_CODES.NOT_FOUND,
        };
      }
    }
    
    return createErrorResponse("testPostgreSQL", error);
  }
}

/**
 * Test SQL Server database connection
 * @param host - Database host
 * @param port - Database port
 * @param database - Database name
 * @param username - Username for authentication
 * @param password - Password for authentication
 * @returns Success or error response
 */
async function testSQLServer(
  host: string,
  port: number,
  database: string,
  username: string,
  password: string
): Promise<QueryResponse<{ message: string }>> {
  const isNamedInstance = host.includes("\\");
  
  const config: sql.config = {
    server: host,
    database,
    user: username,
    password,
    options: {
      encrypt: true,
      trustServerCertificate: true,
      connectTimeout: 10000,
      enableArithAbort: true,
      instanceName: isNamedInstance ? host.split("\\")[1] : undefined,
    },
  };
  
  if (!isNamedInstance) {
    config.port = port;
  } else {
    config.server = host.split("\\")[0];
  }

  try {
    logger.info("Testing SQL Server connection", { host, port, database, username });
    const pool = await sql.connect(config);
    await pool.request().query("SELECT 1 as test");
    await pool.close();
    
    logger.success("SQL Server connection successful", { host, port, database });
    return createSuccessResponse({
      message: "SQL Server connection successful!",
    });
  } catch (error: unknown) {
    logger.error("SQL Server connection failed", { error, host, port, database });
    
    if (error instanceof Error) {
      if (error.message.includes("Login failed")) {
        return {
          success: false,
          data: null,
          error: "Authentication failed. Please check your username and password.",
          code: ERROR_CODES.PERMISSION_DENIED,
        };
      }
      
      if (error.message.includes("ECONNREFUSED") || error.message.includes("Failed to connect")) {
        return {
          success: false,
          data: null,
          error: `Connection refused. Please verify the host (${host}) and port (${port}) are correct.`,
          code: ERROR_CODES.CONNECTION_FAILED,
        };
      }
      
      if (error.message.includes("Cannot open database")) {
        return {
          success: false,
          data: null,
          error: `Database '${database}' does not exist. Please check the database name.`,
          code: ERROR_CODES.NOT_FOUND,
        };
      }
      
      if (error.message.includes("ETIMEOUT") || error.message.includes("timeout")) {
        return {
          success: false,
          data: null,
          error: "Connection timeout. The database server might be unreachable or too slow to respond.",
          code: ERROR_CODES.CONNECTION_FAILED,
        };
      }
      
      if (error.message.includes("EENCRYPT")) {
        return {
          success: false,
          data: null,
          error: "Encryption error. Azure SQL requires encrypted connections. Please ensure SSL is enabled.",
          code: ERROR_CODES.CONNECTION_FAILED,
        };
      }
      
      return {
        success: false,
        data: null,
        error: `SQL Server connection failed: ${error.message}`,
        code: ERROR_CODES.CONNECTION_FAILED,
      };
    }
    
    return {
      success: false,
      data: null,
      error: "An unexpected error occurred while testing the connection. Please check your connection details.",
      code: ERROR_CODES.DB_ERROR,
    };
  }
}

/**
 * Test MySQL database connection
 * @param host - Database host
 * @param port - Database port
 * @param database - Database name
 * @param username - Username for authentication
 * @param password - Password for authentication
 * @returns Success or error response
 */
async function testMySQL(
  host: string,
  port: number,
  database: string,
  username: string,
  password: string
): Promise<QueryResponse<{ message: string }>> {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host,
      port,
      database,
      user: username,
      password,
      connectTimeout: 10000,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    
    await connection.query("SELECT 1 as test");
    await connection.end();
    
    return createSuccessResponse({
      message: "MySQL connection successful!",
    });
  } catch (error: unknown) {
    if (connection) {
      await connection.end();
    }
    
    if (error instanceof Error) {
      if (error.message.includes("Access denied")) {
        return {
          success: false,
          data: null,
          error: "Authentication failed. Please check your username and password.",
          code: ERROR_CODES.PERMISSION_DENIED,
        };
      }
      
      if (error.message.includes("ECONNREFUSED")) {
        return {
          success: false,
          data: null,
          error: "Connection refused. Please check the host and port.",
          code: ERROR_CODES.CONNECTION_FAILED,
        };
      }
      
      if (error.message.includes("Unknown database")) {
        return {
          success: false,
          data: null,
          error: "Database does not exist. Please check the database name.",
          code: ERROR_CODES.NOT_FOUND,
        };
      }
    }
    
    return createErrorResponse("testMySQL", error);
  }
}

/**
 * Test MongoDB database connection
 * @param host - Database host
 * @param port - Database port
 * @param database - Database name
 * @param username - Username for authentication
 * @param password - Password for authentication
 * @returns Success or error response
 */
async function testMongoDB(
  host: string,
  port: number,
  database: string,
  username: string,
  password: string
): Promise<QueryResponse<{ message: string }>> {
  const uri = `mongodb://${username}:${password}@${host}:${port}/${database}`;
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    tls: true,
    tlsAllowInvalidCertificates: true,
  });

  try {
    await client.connect();
    await client.db(database).admin().ping();
    await client.close();
    
    return createSuccessResponse({
      message: "MongoDB connection successful!",
    });
  } catch (error: unknown) {
    await client.close();
    
    if (error instanceof Error) {
      if (error.message.includes("Authentication failed")) {
        return {
          success: false,
          data: null,
          error: "Authentication failed. Please check your username and password.",
          code: ERROR_CODES.PERMISSION_DENIED,
        };
      }
      
      if (error.message.includes("ECONNREFUSED")) {
        return {
          success: false,
          data: null,
          error: "Connection refused. Please check the host and port.",
          code: ERROR_CODES.CONNECTION_FAILED,
        };
      }
    }
    
    return createErrorResponse("testMongoDB", error);
  }
}

/**
 * Test CouchDB database connection
 * @param host - Database host
 * @param port - Database port
 * @param database - Database name
 * @param username - Username for authentication
 * @param password - Password for authentication
 * @returns Success or error response
 */
async function testCouchDB(
  host: string,
  port: number,
  database: string,
  username: string,
  password: string
): Promise<QueryResponse<{ message: string }>> {
  const protocol = port === 6984 || port === 443 ? 'https' : 'http';
  const url = `${protocol}://${username}:${password}@${host}:${port}`;
  const client = nano(url);

  try {
    await client.db.get(database);
    
    return createSuccessResponse({
      message: "CouchDB connection successful!",
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("unauthorized") || error.message.includes("Name or password is incorrect")) {
        return {
          success: false,
          data: null,
          error: "Authentication failed. Please check your username and password.",
          code: ERROR_CODES.PERMISSION_DENIED,
        };
      }
      
      if (error.message.includes("ECONNREFUSED")) {
        return {
          success: false,
          data: null,
          error: "Connection refused. Please check the host and port.",
          code: ERROR_CODES.CONNECTION_FAILED,
        };
      }
      
      if (error.message.includes("Database does not exist")) {
        return {
          success: false,
          data: null,
          error: "Database does not exist. Please check the database name.",
          code: ERROR_CODES.NOT_FOUND,
        };
      }
    }
    
    return createErrorResponse("testCouchDB", error);
  }
}

