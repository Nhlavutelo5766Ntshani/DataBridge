import { z, ZodSchema } from "zod";

type ParseFormDataResult<T> =
  | {
      success: true;
      data: T;
      errors: null;
    }
  | {
      success: false;
      data: null;
      errors: z.ZodError;
    };

/**
 * Parse and validate form data using a Zod schema
 * @param formData - The FormData object to parse
 * @param schema - The Zod schema to validate against
 * @returns Parsed and validated data or validation errors
 */
export function parseFormData<T>(
  formData: FormData,
  schema: ZodSchema<T>
): ParseFormDataResult<T> {
  const data: Record<string, unknown> = {};

  formData.forEach((value, key) => {
    if (key.endsWith("[]")) {
      const arrayKey = key.slice(0, -2);
      if (!data[arrayKey]) {
        data[arrayKey] = [];
      }
      (data[arrayKey] as unknown[]).push(value);
    } else {
      data[key] = value;
    }
  });

  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
      errors: null,
    };
  }

  return {
    success: false,
    data: null,
    errors: result.error,
  };
}

