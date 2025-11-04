/**
 * Database column metadata
 */
export type DatabaseColumn = {
  name: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  maxLength?: number | null;
  defaultValue?: string | null;
};

/**
 * Database table metadata
 */
export type DatabaseTable = {
  name: string;
  schema?: string;
  columns: DatabaseColumn[];
  rowCount?: number;
};

/**
 * Complete database schema structure
 */
export type DatabaseSchema = {
  tables: DatabaseTable[];
  databaseType: string;
  databaseName: string;
};

/**
 * Connection credentials for schema discovery
 */
export type SchemaDiscoveryConnection = {
  dbType: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
};

export type TableSchema = DatabaseTable;
export type ColumnSchema = DatabaseColumn;


