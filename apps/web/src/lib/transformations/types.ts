/**
 * Transformation types and interfaces
 */

export type TransformationType =
  | "type_conversion"
  | "date_format"
  | "string_transform"
  | "numeric_transform"
  | "custom_script";

export type TransformationCategory = "built-in" | "custom";

export type Transformation = {
  id: string;
  name: string;
  description: string;
  type: TransformationType;
  category: TransformationCategory;
  inputType?: string;
  outputType?: string;
  parameters?: TransformationParameter[];
  script?: string;
};

export type TransformationParameter = {
  name: string;
  type: "string" | "number" | "boolean" | "select";
  description: string;
  required: boolean;
  defaultValue?: string | number | boolean;
  options?: { label: string; value: string }[];
};

export type AppliedTransformation = {
  id: string;
  transformationId: string;
  columnMappingId: string;
  parameters: Record<string, string | number | boolean>;
  order: number;
};

