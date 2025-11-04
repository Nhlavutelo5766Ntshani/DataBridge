/**
 * Transformation type
 */
export type TransformationType = 
  | "TYPE_CONVERSION"
  | "CUSTOM_SQL"
  | "EXCLUDE_COLUMN"
  | "DEFAULT_VALUE"
  | "CONCATENATE"
  | "SPLIT"
  | "UPPERCASE"
  | "LOWERCASE"
  | "TRIM"
  | "REPLACE"
  | "DATE_FORMAT";

/**
 * Transformation configuration
 */
export type TransformationConfig = {
  type: TransformationType;
  parameters: Record<string, unknown>;
};

/**
 * Type conversion transformation
 */
export type TypeConversionTransformation = {
  type: "TYPE_CONVERSION";
  parameters: {
    sourceType: string;
    targetType: string;
    format?: string;
  };
};

/**
 * Custom SQL transformation
 */
export type CustomSQLTransformation = {
  type: "CUSTOM_SQL";
  parameters: {
    expression: string;
    variables?: Record<string, string>;
  };
};

/**
 * Exclude column transformation
 */
export type ExcludeColumnTransformation = {
  type: "EXCLUDE_COLUMN";
  parameters: {
    reason?: string;
  };
};

/**
 * Default value transformation
 */
export type DefaultValueTransformation = {
  type: "DEFAULT_VALUE";
  parameters: {
    value: string | number | boolean | null;
  };
};

/**
 * Data type mapping between databases
 */
export type DataTypeMapping = {
  sourceType: string;
  targetType: string;
  requiresTransformation: boolean;
  transformationHint?: string;
};





