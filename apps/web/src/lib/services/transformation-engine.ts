import type {
  TransformationConfig,
  TypeConversionTransformation,
  CustomSQLTransformation,
  DefaultValueTransformation,
  DataTypeMapping,
} from "@/lib/types/transformation";

/**
 * Type compatibility matrix for cross-database migrations
 */
const TYPE_COMPATIBILITY_MAP: Record<string, Record<string, Record<string, DataTypeMapping>>> = {
  postgresql: {
    sqlserver: {
      text: { sourceType: "text", targetType: "NVARCHAR(MAX)", requiresTransformation: false },
      varchar: { sourceType: "varchar", targetType: "VARCHAR", requiresTransformation: false },
      integer: { sourceType: "integer", targetType: "INT", requiresTransformation: false },
      bigint: { sourceType: "bigint", targetType: "BIGINT", requiresTransformation: false },
      boolean: { sourceType: "boolean", targetType: "BIT", requiresTransformation: true, transformationHint: "CAST(CASE WHEN column THEN 1 ELSE 0 END AS BIT)" },
      timestamp: { sourceType: "timestamp", targetType: "DATETIME2", requiresTransformation: false },
      date: { sourceType: "date", targetType: "DATE", requiresTransformation: false },
      jsonb: { sourceType: "jsonb", targetType: "NVARCHAR(MAX)", requiresTransformation: true, transformationHint: "Convert JSON to string" },
    },
    mysql: {
      text: { sourceType: "text", targetType: "TEXT", requiresTransformation: false },
      varchar: { sourceType: "varchar", targetType: "VARCHAR", requiresTransformation: false },
      integer: { sourceType: "integer", targetType: "INT", requiresTransformation: false },
      bigint: { sourceType: "bigint", targetType: "BIGINT", requiresTransformation: false },
      boolean: { sourceType: "boolean", targetType: "TINYINT(1)", requiresTransformation: true, transformationHint: "CAST(column AS UNSIGNED)" },
      timestamp: { sourceType: "timestamp", targetType: "DATETIME", requiresTransformation: false },
      date: { sourceType: "date", targetType: "DATE", requiresTransformation: false },
      jsonb: { sourceType: "jsonb", targetType: "JSON", requiresTransformation: false },
    },
  },
  sqlserver: {
    postgresql: {
      "nvarchar": { sourceType: "nvarchar", targetType: "VARCHAR", requiresTransformation: false },
      "varchar": { sourceType: "varchar", targetType: "VARCHAR", requiresTransformation: false },
      "int": { sourceType: "int", targetType: "INTEGER", requiresTransformation: false },
      "bigint": { sourceType: "bigint", targetType: "BIGINT", requiresTransformation: false },
      "bit": { sourceType: "bit", targetType: "BOOLEAN", requiresTransformation: true, transformationHint: "CASE WHEN column = 1 THEN TRUE ELSE FALSE END" },
      "datetime2": { sourceType: "datetime2", targetType: "TIMESTAMP", requiresTransformation: false },
      "date": { sourceType: "date", targetType: "DATE", requiresTransformation: false },
    },
    mysql: {
      "nvarchar": { sourceType: "nvarchar", targetType: "VARCHAR", requiresTransformation: false },
      "varchar": { sourceType: "varchar", targetType: "VARCHAR", requiresTransformation: false },
      "int": { sourceType: "int", targetType: "INT", requiresTransformation: false },
      "bigint": { sourceType: "bigint", targetType: "BIGINT", requiresTransformation: false },
      "bit": { sourceType: "bit", targetType: "TINYINT(1)", requiresTransformation: false },
      "datetime2": { sourceType: "datetime2", targetType: "DATETIME", requiresTransformation: false },
      "date": { sourceType: "date", targetType: "DATE", requiresTransformation: false },
    },
  },
  mysql: {
    postgresql: {
      "varchar": { sourceType: "varchar", targetType: "VARCHAR", requiresTransformation: false },
      "text": { sourceType: "text", targetType: "TEXT", requiresTransformation: false },
      "int": { sourceType: "int", targetType: "INTEGER", requiresTransformation: false },
      "bigint": { sourceType: "bigint", targetType: "BIGINT", requiresTransformation: false },
      "tinyint": { sourceType: "tinyint", targetType: "BOOLEAN", requiresTransformation: true, transformationHint: "column = 1" },
      "datetime": { sourceType: "datetime", targetType: "TIMESTAMP", requiresTransformation: false },
      "date": { sourceType: "date", targetType: "DATE", requiresTransformation: false },
      "json": { sourceType: "json", targetType: "JSONB", requiresTransformation: false },
    },
    sqlserver: {
      "varchar": { sourceType: "varchar", targetType: "VARCHAR", requiresTransformation: false },
      "text": { sourceType: "text", targetType: "NVARCHAR(MAX)", requiresTransformation: false },
      "int": { sourceType: "int", targetType: "INT", requiresTransformation: false },
      "bigint": { sourceType: "bigint", targetType: "BIGINT", requiresTransformation: false },
      "tinyint": { sourceType: "tinyint", targetType: "BIT", requiresTransformation: true, transformationHint: "CAST(column AS BIT)" },
      "datetime": { sourceType: "datetime", targetType: "DATETIME2", requiresTransformation: false },
      "date": { sourceType: "date", targetType: "DATE", requiresTransformation: false },
      "json": { sourceType: "json", targetType: "NVARCHAR(MAX)", requiresTransformation: true, transformationHint: "Convert JSON to string" },
    },
  },
};

/**
 * Get data type mapping suggestion
 * @param sourceDbType - Source database type
 * @param targetDbType - Target database type
 * @param sourceDataType - Source column data type
 * @returns Data type mapping or null
 */
export function getDataTypeMapping(
  sourceDbType: string,
  targetDbType: string,
  sourceDataType: string
): DataTypeMapping | null {
  const sourceDb = sourceDbType.toLowerCase();
  const targetDb = targetDbType.toLowerCase();
  const normalizedSourceType = sourceDataType.toLowerCase().replace(/\(.*\)/, "");

  const mapping = TYPE_COMPATIBILITY_MAP[sourceDb]?.[targetDb]?.[normalizedSourceType];
  return mapping || null;
}

/**
 * Apply transformation to a value
 * @param value - Input value
 * @param transformation - Transformation configuration
 * @returns Transformed value
 */
export function applyTransformation(
  value: unknown,
  transformation: TransformationConfig
): unknown {
  switch (transformation.type) {
    case "TYPE_CONVERSION":
      return applyTypeConversion(value, transformation as TypeConversionTransformation);
    
    case "CUSTOM_SQL":
      return null;
    
    case "EXCLUDE_COLUMN":
      return null;
    
    case "DEFAULT_VALUE":
      return applyDefaultValue(value, transformation as DefaultValueTransformation);
    
    case "UPPERCASE":
      return typeof value === "string" ? value.toUpperCase() : value;
    
    case "LOWERCASE":
      return typeof value === "string" ? value.toLowerCase() : value;
    
    case "TRIM":
      return typeof value === "string" ? value.trim() : value;
    
    default:
      return value;
  }
}

/**
 * Apply type conversion transformation
 * @param value - Input value
 * @param transformation - Type conversion configuration
 * @returns Converted value
 */
function applyTypeConversion(
  value: unknown,
  transformation: TypeConversionTransformation
): unknown {
  const { targetType } = transformation.parameters;

  if (value === null || value === undefined) {
    return null;
  }

  const normalizedTargetType = targetType.toLowerCase();

  if (normalizedTargetType.includes("int") || normalizedTargetType.includes("bigint")) {
    return parseInt(String(value), 10);
  }

  if (normalizedTargetType.includes("decimal") || normalizedTargetType.includes("float")) {
    return parseFloat(String(value));
  }

  if (normalizedTargetType.includes("bool") || normalizedTargetType === "bit") {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      return lower === "true" || lower === "1" || lower === "yes";
    }
    return Boolean(value);
  }

  if (normalizedTargetType.includes("varchar") || normalizedTargetType.includes("text")) {
    return String(value);
  }

  if (normalizedTargetType.includes("date") || normalizedTargetType.includes("time")) {
    if (value instanceof Date) return value;
    return new Date(String(value));
  }

  return value;
}

/**
 * Apply default value transformation
 * @param value - Input value
 * @param transformation - Default value configuration
 * @returns Value or default
 */
function applyDefaultValue(
  value: unknown,
  transformation: DefaultValueTransformation
): unknown {
  if (value === null || value === undefined || value === "") {
    return transformation.parameters.value;
  }
  return value;
}

/**
 * Generate SQL expression for transformation
 * @param columnName - Column name
 * @param transformation - Transformation configuration
 * @param dbType - Target database type
 * @returns SQL expression
 */
export function generateTransformationSQL(
  columnName: string,
  transformation: TransformationConfig,
  dbType: string
): string {
  switch (transformation.type) {
    case "TYPE_CONVERSION": {
      const config = transformation as TypeConversionTransformation;
      return generateTypeConversionSQL(columnName, config, dbType);
    }
    
    case "CUSTOM_SQL": {
      const config = transformation as CustomSQLTransformation;
      return config.parameters.expression.replace(/\{column\}/g, columnName);
    }
    
    case "EXCLUDE_COLUMN":
      return "";
    
    case "DEFAULT_VALUE": {
      const config = transformation as DefaultValueTransformation;
      const defaultVal = formatSQLValue(config.parameters.value, dbType);
      return `COALESCE(${columnName}, ${defaultVal})`;
    }
    
    case "UPPERCASE":
      return `UPPER(${columnName})`;
    
    case "LOWERCASE":
      return `LOWER(${columnName})`;
    
    case "TRIM":
      return `TRIM(${columnName})`;
    
    case "CONCATENATE": {
      const params = transformation.parameters as { columns: string[]; separator?: string };
      const sep = params.separator || "";
      return `CONCAT(${params.columns.join(`, '${sep}', `)})`;
    }
    
    default:
      return columnName;
  }
}

/**
 * Generate SQL for type conversion
 * @param columnName - Column name
 * @param transformation - Type conversion configuration
 * @param dbType - Target database type
 * @returns SQL expression
 */
function generateTypeConversionSQL(
  columnName: string,
  transformation: TypeConversionTransformation,
  dbType: string
): string {
  const { targetType } = transformation.parameters;
  const normalizedDbType = dbType.toLowerCase();

  if (normalizedDbType === "postgresql") {
    return `${columnName}::${targetType}`;
  }

  if (normalizedDbType === "sqlserver" || normalizedDbType === "mysql") {
    return `CAST(${columnName} AS ${targetType})`;
  }

  return columnName;
}

/**
 * Format value for SQL
 * @param value - Value to format
 * @param dbType - Database type
 * @returns Formatted SQL value
 */
function formatSQLValue(value: unknown, dbType: string): string {
  if (value === null) return "NULL";
  
  if (typeof value === "string") {
    return `'${value.replace(/'/g, "''")}'`;
  }
  
  if (typeof value === "boolean") {
    if (dbType.toLowerCase() === "postgresql") {
      return value ? "TRUE" : "FALSE";
    }
    return value ? "1" : "0";
  }
  
  return String(value);
}

/**
 * Validate transformation configuration
 * @param transformation - Transformation configuration
 * @returns Validation result
 */
export function validateTransformation(
  transformation: TransformationConfig
): { valid: boolean; error?: string } {
  if (!transformation.type) {
    return { valid: false, error: "Transformation type is required" };
  }

  switch (transformation.type) {
    case "TYPE_CONVERSION": {
      const config = transformation as TypeConversionTransformation;
      if (!config.parameters.targetType) {
        return { valid: false, error: "Target type is required for type conversion" };
      }
      break;
    }
    
    case "CUSTOM_SQL": {
      const config = transformation as CustomSQLTransformation;
      if (!config.parameters.expression) {
        return { valid: false, error: "SQL expression is required for custom SQL transformation" };
      }
      break;
    }
    
    case "DEFAULT_VALUE": {
      const config = transformation as DefaultValueTransformation;
      if (config.parameters.value === undefined) {
        return { valid: false, error: "Default value is required" };
      }
      break;
    }
  }

  return { valid: true };
}

/**
 * Get suggested transformations for a column mapping
 * @param sourceType - Source column data type
 * @param targetType - Target column data type
 * @param sourceDbType - Source database type
 * @param targetDbType - Target database type
 * @returns Array of suggested transformations
 */
export function getSuggestedTransformations(
  sourceType: string,
  targetType: string,
  sourceDbType: string,
  targetDbType: string
): TransformationConfig[] {
  const suggestions: TransformationConfig[] = [];
  
  const mapping = getDataTypeMapping(sourceDbType, targetDbType, sourceType);
  
  if (mapping && mapping.requiresTransformation) {
    suggestions.push({
      type: "TYPE_CONVERSION",
      parameters: {
        sourceType: mapping.sourceType,
        targetType: mapping.targetType,
      },
    });
  }
  
  if (sourceType.toLowerCase() !== targetType.toLowerCase()) {
    suggestions.push({
      type: "TYPE_CONVERSION",
      parameters: {
        sourceType,
        targetType,
      },
    });
  }
  
  return suggestions;
}

