/**
 * Built-in transformation library
 * Pre-defined transformations for common data migration scenarios
 */

import type { Transformation } from "./types";

export const BUILT_IN_TRANSFORMATIONS: Transformation[] = [
  {
    id: "varchar-to-text",
    name: "VARCHAR to TEXT",
    description: "Convert SQL Server VARCHAR to PostgreSQL TEXT",
    type: "type_conversion",
    category: "built-in",
    inputType: "VARCHAR",
    outputType: "TEXT",
  },
  {
    id: "int-to-serial",
    name: "INT to SERIAL",
    description: "Convert SQL Server INT identity to PostgreSQL SERIAL",
    type: "type_conversion",
    category: "built-in",
    inputType: "INT",
    outputType: "SERIAL",
  },
  {
    id: "datetime-to-timestamp",
    name: "DATETIME to TIMESTAMP",
    description: "Convert SQL Server DATETIME to PostgreSQL TIMESTAMP",
    type: "type_conversion",
    category: "built-in",
    inputType: "DATETIME",
    outputType: "TIMESTAMP",
  },
  {
    id: "decimal-to-numeric",
    name: "DECIMAL to NUMERIC",
    description: "Convert SQL Server DECIMAL to PostgreSQL NUMERIC",
    type: "type_conversion",
    category: "built-in",
    inputType: "DECIMAL",
    outputType: "NUMERIC",
  },
  {
    id: "bit-to-boolean",
    name: "BIT to BOOLEAN",
    description: "Convert SQL Server BIT to PostgreSQL BOOLEAN",
    type: "type_conversion",
    category: "built-in",
    inputType: "BIT",
    outputType: "BOOLEAN",
  },
  {
    id: "date-format-iso",
    name: "Format Date to ISO 8601",
    description: "Convert date to ISO 8601 format (YYYY-MM-DD)",
    type: "date_format",
    category: "built-in",
    parameters: [
      {
        name: "sourceFormat",
        type: "select",
        description: "Source date format",
        required: true,
        options: [
          { label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
          { label: "DD/MM/YYYY", value: "DD/MM/YYYY" },
          { label: "YYYY-MM-DD", value: "YYYY-MM-DD" },
        ],
      },
    ],
  },
  {
    id: "add-timezone",
    name: "Add Timezone",
    description: "Add timezone information to timestamp",
    type: "date_format",
    category: "built-in",
    parameters: [
      {
        name: "timezone",
        type: "select",
        description: "Target timezone",
        required: true,
        defaultValue: "UTC",
        options: [
          { label: "UTC", value: "UTC" },
          { label: "America/New_York", value: "America/New_York" },
          { label: "Europe/London", value: "Europe/London" },
          { label: "Asia/Tokyo", value: "Asia/Tokyo" },
        ],
      },
    ],
  },
  {
    id: "uppercase",
    name: "Convert to UPPERCASE",
    description: "Convert string to uppercase",
    type: "string_transform",
    category: "built-in",
  },
  {
    id: "lowercase",
    name: "Convert to lowercase",
    description: "Convert string to lowercase",
    type: "string_transform",
    category: "built-in",
  },
  {
    id: "trim",
    name: "Trim Whitespace",
    description: "Remove leading and trailing whitespace",
    type: "string_transform",
    category: "built-in",
  },
  {
    id: "replace",
    name: "Find and Replace",
    description: "Replace occurrences of a string",
    type: "string_transform",
    category: "built-in",
    parameters: [
      {
        name: "find",
        type: "string",
        description: "String to find",
        required: true,
      },
      {
        name: "replace",
        type: "string",
        description: "Replacement string",
        required: true,
      },
    ],
  },
  {
    id: "substring",
    name: "Extract Substring",
    description: "Extract a portion of the string",
    type: "string_transform",
    category: "built-in",
    parameters: [
      {
        name: "start",
        type: "number",
        description: "Start position (0-based)",
        required: true,
      },
      {
        name: "length",
        type: "number",
        description: "Length to extract",
        required: false,
      },
    ],
  },
  {
    id: "round",
    name: "Round Number",
    description: "Round to specified decimal places",
    type: "numeric_transform",
    category: "built-in",
    parameters: [
      {
        name: "decimals",
        type: "number",
        description: "Number of decimal places",
        required: true,
        defaultValue: 2,
      },
    ],
  },
  {
    id: "floor",
    name: "Floor",
    description: "Round down to nearest integer",
    type: "numeric_transform",
    category: "built-in",
  },
  {
    id: "ceil",
    name: "Ceiling",
    description: "Round up to nearest integer",
    type: "numeric_transform",
    category: "built-in",
  },
  {
    id: "abs",
    name: "Absolute Value",
    description: "Get absolute value of number",
    type: "numeric_transform",
    category: "built-in",
  },
  {
    id: "multiply",
    name: "Multiply",
    description: "Multiply by a constant",
    type: "numeric_transform",
    category: "built-in",
    parameters: [
      {
        name: "multiplier",
        type: "number",
        description: "Multiplier value",
        required: true,
      },
    ],
  },
  {
    id: "divide",
    name: "Divide",
    description: "Divide by a constant",
    type: "numeric_transform",
    category: "built-in",
    parameters: [
      {
        name: "divisor",
        type: "number",
        description: "Divisor value",
        required: true,
      },
    ],
  },
];

/**
 * Get transformation by ID
 */
export const getTransformationById = (
  id: string
): Transformation | undefined => {
  return BUILT_IN_TRANSFORMATIONS.find((t) => t.id === id);
};

/**
 * Get transformations by type
 */
export const getTransformationsByType = (type: string): Transformation[] => {
  return BUILT_IN_TRANSFORMATIONS.filter((t) => t.type === type);
};

/**
 * Get transformations by category
 */
export const getTransformationsByCategory = (
  category: string
): Transformation[] => {
  return BUILT_IN_TRANSFORMATIONS.filter((t) => t.category === category);
};

