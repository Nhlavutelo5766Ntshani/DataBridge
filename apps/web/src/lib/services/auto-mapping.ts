import type { DatabaseSchema, DatabaseTable } from "@/lib/types/schema";

/**
 * Suggested table mapping
 */
export type TableMappingSuggestion = {
  sourceTable: string;
  targetTable: string;
  confidence: number;
  reason: string;
};

/**
 * Suggested column mapping
 */
export type ColumnMappingSuggestion = {
  sourceColumn: string;
  targetColumn: string;
  confidence: number;
  reason: string;
};

/**
 * Complete mapping suggestions
 */
export type MappingSuggestions = {
  tableMappings: TableMappingSuggestion[];
  columnMappings: Record<string, ColumnMappingSuggestion[]>;
};

/**
 * Calculate Levenshtein distance between two strings
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Distance value
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0-1 range)
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1.0;

  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  
  return 1 - distance / maxLength;
}

/**
 * Normalize name by removing common prefixes/suffixes and converting case
 * @param name - Name to normalize
 * @returns Normalized name
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(tbl_|t_|src_|trg_|dbo\.)/g, "")
    .replace(/(_id|_pk|_key)$/g, "")
    .replace(/_/g, "")
    .replace(/-/g, "");
}

/**
 * Generate auto-mapping suggestions for tables and columns
 * @param sourceSchema - Source database schema
 * @param targetSchema - Target database schema
 * @param minConfidence - Minimum confidence threshold (default 0.7)
 * @returns Mapping suggestions
 */
export function generateAutoMappingSuggestions(
  sourceSchema: DatabaseSchema,
  targetSchema: DatabaseSchema,
  minConfidence = 0.7
): MappingSuggestions {
  const tableMappings: TableMappingSuggestion[] = [];
  const columnMappings: Record<string, ColumnMappingSuggestion[]> = {};

  for (const sourceTable of sourceSchema.tables) {
    let bestMatch: { table: DatabaseTable; score: number; reason: string } | null = null;

    for (const targetTable of targetSchema.tables) {
      const normalizedSource = normalizeName(sourceTable.name);
      const normalizedTarget = normalizeName(targetTable.name);
      const similarity = calculateSimilarity(normalizedSource, normalizedTarget);
      
      let score = similarity;
      let reason = `Name similarity: ${(similarity * 100).toFixed(0)}%`;

      if (sourceTable.name.toLowerCase() === targetTable.name.toLowerCase()) {
        score = 1.0;
        reason = "Exact name match";
      }

      if (normalizedSource === normalizedTarget) {
        score = 0.95;
        reason = "Normalized name match";
      }

      if (score > (bestMatch?.score || 0)) {
        bestMatch = { table: targetTable, score, reason };
      }
    }

    if (bestMatch && bestMatch.score >= minConfidence) {
      tableMappings.push({
        sourceTable: sourceTable.name,
        targetTable: bestMatch.table.name,
        confidence: bestMatch.score,
        reason: bestMatch.reason,
      });

      columnMappings[`${sourceTable.name}->${bestMatch.table.name}`] = 
        generateColumnMappings(sourceTable, bestMatch.table, minConfidence);
    }
  }

  return { tableMappings, columnMappings };
}

/**
 * Generate column mapping suggestions between two tables
 * @param sourceTable - Source table
 * @param targetTable - Target table
 * @param minConfidence - Minimum confidence threshold
 * @returns Column mapping suggestions
 */
function generateColumnMappings(
  sourceTable: DatabaseTable,
  targetTable: DatabaseTable,
  minConfidence: number
): ColumnMappingSuggestion[] {
  const mappings: ColumnMappingSuggestion[] = [];
  const targetColumnsMatched = new Set<string>();

  for (const sourceColumn of sourceTable.columns) {
    let bestMatch: { columnName: string; score: number; reason: string } | null = null;

    for (const targetColumn of targetTable.columns) {
      if (targetColumnsMatched.has(targetColumn.name)) continue;

      const normalizedSource = normalizeName(sourceColumn.name);
      const normalizedTarget = normalizeName(targetColumn.name);
      const similarity = calculateSimilarity(normalizedSource, normalizedTarget);
      
      let score = similarity;
      let reason = `Name similarity: ${(similarity * 100).toFixed(0)}%`;

      if (sourceColumn.name.toLowerCase() === targetColumn.name.toLowerCase()) {
        score = 1.0;
        reason = "Exact name match";
      }

      if (normalizedSource === normalizedTarget) {
        score = 0.95;
        reason = "Normalized name match";
      }

      if (sourceColumn.isPrimaryKey && targetColumn.isPrimaryKey) {
        score += 0.1;
        reason += " (both primary keys)";
      }

      const sourceType = sourceColumn.dataType.toLowerCase();
      const targetType = targetColumn.dataType.toLowerCase();
      
      if (sourceType === targetType) {
        score += 0.05;
        reason += " (same type)";
      }

      if (score > (bestMatch?.score || 0)) {
        bestMatch = { columnName: targetColumn.name, score, reason };
      }
    }

    if (bestMatch && bestMatch.score >= minConfidence) {
      mappings.push({
        sourceColumn: sourceColumn.name,
        targetColumn: bestMatch.columnName,
        confidence: Math.min(bestMatch.score, 1.0),
        reason: bestMatch.reason,
      });
      
      targetColumnsMatched.add(bestMatch.columnName);
    }
  }

  return mappings;
}

/**
 * Apply auto-mapping suggestions to get quick mappings
 * @param suggestions - Mapping suggestions
 * @param confidenceThreshold - Only apply mappings above this confidence
 * @returns Array of table mapping IDs
 */
export function applyAutoMappingSuggestions(
  suggestions: MappingSuggestions,
  confidenceThreshold = 0.85
): { sourceTable: string; targetTable: string; columns: { source: string; target: string }[] }[] {
  return suggestions.tableMappings
    .filter(mapping => mapping.confidence >= confidenceThreshold)
    .map(tableMapping => {
      const key = `${tableMapping.sourceTable}->${tableMapping.targetTable}`;
      const columnMaps = suggestions.columnMappings[key] || [];
      
      return {
        sourceTable: tableMapping.sourceTable,
        targetTable: tableMapping.targetTable,
        columns: columnMaps
          .filter(col => col.confidence >= confidenceThreshold)
          .map(col => ({
            source: col.sourceColumn,
            target: col.targetColumn,
          })),
      };
    });
}





