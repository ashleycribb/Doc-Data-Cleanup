import type { VariableSuggestion } from '../types';

/**
 * A robust, RFC 4180-compliant CSV parser.
 * This refactored implementation uses a state machine to correctly handle
 * quoted fields, commas and newlines within fields, and escaped quotes ("").
 * @param csv The raw CSV string.
 * @returns A 2D array of strings representing the data.
 */
export const parseCSV = (csv: string): string[][] => {
  const rows: string[][] = [];
  if (!csv) return rows;

  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  // Normalize line endings and add a final newline for easier parsing of the last line.
  const content = csv.trim().replace(/\r\n/g, '\n') + '\n';

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (inQuotes) {
      if (char === '"') {
        // Check for an escaped double quote ("")
        if (i + 1 < content.length && content[i + 1] === '"') {
          currentField += '"';
          i++; // Skip the next quote, as it's part of the escape sequence
        } else {
          inQuotes = false; // This is a closing quote
        }
      } else {
        currentField += char; // Append character to the field content
      }
    } else { // Not in quotes
      if (char === '"' && currentField === '') {
        // A quote at the very beginning of a field starts quote mode.
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField);
        // Only add non-empty rows to the final result.
        // This prevents adding an extra empty row for a trailing newline.
        if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
            rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        // A regular character in an unquoted field
        currentField += char;
      }
    }
  }

  return rows;
};


/**
 * Serializes a 2D array back into a robust, RFC 4180-compliant CSV string.
 * This function correctly handles fields that require quoting by:
 * 1. Escaping any internal double quotes (`"`) with another double quote (`""`).
 * 2. Wrapping the entire field in double quotes if it contains commas, newlines, or double quotes.
 * @param data The 2D array of data.
 * @returns A raw CSV string.
 */
export const serializeCSV = (data: string[][]): string => {
  const escapeField = (field: string | null | undefined): string => {
    const fieldStr = field === null || field === undefined ? '' : String(field);
    
    // Regular expression to check for characters that require quoting.
    const needsQuotes = /[,"\n]/.test(fieldStr);
    
    if (needsQuotes) {
      // Within a quoted field, any double quote must be escaped by another double quote.
      const escapedField = fieldStr.replace(/"/g, '""');
      return `"${escapedField}"`;
    }
    
    return fieldStr;
  };

  return data.map(row => 
    row.map(escapeField).join(',')
  ).join('\n');
};


/**
 * Finds the index of a column by its header name (case-insensitive).
 * @param headers The first row of the data array.
 * @param columnName The name of the column to find.
 * @returns The index of the column, or -1 if not found.
 */
const findColumnIndex = (headers: string[], columnName: string): number => {
  return headers.findIndex(header => header.trim().toLowerCase() === columnName.trim().toLowerCase());
};


// --- Cleaning Functions ---

export const trimWhitespace = (data: string[][]): string[][] => {
  return data.map(row => row.map(cell => cell.trim()));
};

export const removeDuplicateRows = (data: string[][]): string[][] => {
  const seen = new Set<string>();
  return data.filter(row => {
    const rowString = row.join(',');
    if (seen.has(rowString)) {
      return false;
    }
    seen.add(rowString);
    return true;
  });
};

export const standardizeCapitalization = (data: string[][], args: { columnName: string }): string[][] => {
  const [headers, ...rows] = data;
  const colIndex = findColumnIndex(headers, args.columnName);
  
  if (colIndex === -1) {
    throw new Error(`Column "${args.columnName}" not found for capitalization. The AI may have provided an invalid column name.`);
  }
  
  const updatedRows = rows.map(row => {
    if (row[colIndex]) {
      // Simple title case for demonstration
      row[colIndex] = row[colIndex].charAt(0).toUpperCase() + row[colIndex].slice(1).toLowerCase();
    }
    return row;
  });

  return [headers, ...updatedRows];
};

export const imputeMissingNumeric = (data: string[][], args: { columnName: string, method: 'mean' | 'median' }): string[][] => {
  const [headers, ...rows] = data;
  const colIndex = findColumnIndex(headers, args.columnName);

  if (colIndex === -1) {
    throw new Error(`Column "${args.columnName}" not found for numeric imputation. The AI may have provided an invalid column name.`);
  }

  const values = rows.map(row => parseFloat(row[colIndex])).filter(val => !isNaN(val));
  if (values.length === 0) return data; // No data to calculate from

  let replacementValue: number;
  if (args.method === 'mean') {
    const sum = values.reduce((acc, val) => acc + val, 0);
    replacementValue = sum / values.length;
  } else { // median
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    replacementValue = values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  }
  
  const updatedRows = rows.map(row => {
    const val = parseFloat(row[colIndex]);
    if (row[colIndex] === '' || row[colIndex] === null || isNaN(val)) {
      row[colIndex] = replacementValue.toFixed(2);
    }
    return row;
  });

  return [headers, ...updatedRows];
};

export const imputeMissingCategorical = (data: string[][], args: { columnName: string, value: string }): string[][] => {
  const [headers, ...rows] = data;
  const colIndex = findColumnIndex(headers, args.columnName);
  
  if (colIndex === -1) {
    throw new Error(`Column "${args.columnName}" not found for categorical imputation. The AI may have provided an invalid column name.`);
  }
  
  const updatedRows = rows.map(row => {
    if (row[colIndex] === '' || row[colIndex] === null || row[colIndex].toLowerCase() === 'n/a') {
      row[colIndex] = args.value;
    }
    return row;
  });

  return [headers, ...updatedRows];
};

// --- New Orange-Inspired Functions ---

export const discretizeColumn = (data: string[][], args: { columnName: string, method: 'equal-width' | 'equal-frequency', bins: number }): string[][] => {
    const [headers, ...rows] = data;
    const colIndex = findColumnIndex(headers, args.columnName);

    if (colIndex === -1) {
        throw new Error(`Column "${args.columnName}" not found for discretization. The AI may have provided an invalid column name.`);
    }

    const newHeader = `${args.columnName}_discretized`;
    if (headers.includes(newHeader)) return data; // Avoid re-adding column

    const values = rows.map(row => parseFloat(row[colIndex])).filter(v => !isNaN(v));
    if (values.length === 0) return data;

    const binEdges: number[] = [];
    const min = Math.min(...values);
    const max = Math.max(...values);

    if (args.method === 'equal-width') {
        const width = (max - min) / args.bins;
        for (let i = 1; i < args.bins; i++) {
            binEdges.push(min + i * width);
        }
    } else { // equal-frequency
        values.sort((a, b) => a - b);
        const chunkSize = Math.ceil(values.length / args.bins);
        for (let i = 1; i < args.bins; i++) {
            const edgeIndex = i * chunkSize;
            if (edgeIndex < values.length) {
                binEdges.push(values[edgeIndex]);
            }
        }
    }

    const newHeaders = [...headers, newHeader];
    const newRows = rows.map(row => {
        const val = parseFloat(row[colIndex]);
        if (isNaN(val)) {
            return [...row, 'N/A'];
        }
        let binIndex = binEdges.findIndex(edge => val < edge);
        if (binIndex === -1) binIndex = args.bins - 1;
        return [...row, `Bin_${binIndex + 1}`];
    });

    return [newHeaders, ...newRows];
};


export const normalizeColumn = (data: string[][], args: { columnName: string }): string[][] => {
    const [headers, ...rows] = data;
    const colIndex = findColumnIndex(headers, args.columnName);

    if (colIndex === -1) {
        throw new Error(`Column "${args.columnName}" not found for normalization. The AI may have provided an invalid column name.`);
    }

    const newHeader = `${args.columnName}_normalized`;
    if (headers.includes(newHeader)) return data;

    const values = rows.map(row => parseFloat(row[colIndex])).filter(v => !isNaN(v));
    if (values.length < 2) return data;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    // Avoid division by zero if all values are the same
    if (range === 0) {
        const newHeaders = [...headers, newHeader];
        const newRows = rows.map(row => [...row, '0.5']);
        return [newHeaders, ...newRows];
    }
    
    const newHeaders = [...headers, newHeader];
    const newRows = rows.map(row => {
        const val = parseFloat(row[colIndex]);
        if (isNaN(val)) {
            return [...row, ''];
        }
        const normalized = (val - min) / range;
        return [...row, normalized.toFixed(4)];
    });

    return [newHeaders, ...newRows];
};


// Helper for correlation calculation
const calculateCorrelation = (x: number[], y: number[]): number => {
    const n = x.length;
    if (n === 0) return 0;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.map((xi, i) => xi * y[i]).reduce((a, b) => a + b, 0);
    const sumX2 = x.map(xi => xi * xi).reduce((a, b) => a + b, 0);
    const sumY2 = y.map(yi => yi * yi).reduce((a, b) => a + b, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
};

export const selectFeaturesByCorrelation = (data: string[][], args: { threshold: number }): string[][] => {
    const [headers, ...rows] = data;
    const numericColumns: { name: string; index: number; values: number[] }[] = [];

    // Identify numeric columns
    headers.forEach((header, index) => {
        const values = rows.map(row => parseFloat(row[index])).filter(v => !isNaN(v));
        // Consider it numeric if at least half the values are numbers
        if (values.length > rows.length / 2) {
            numericColumns.push({ name: header, index, values });
        }
    });

    if (numericColumns.length < 2) return data;

    const columnsToRemove = new Set<number>();

    // Calculate pairwise correlation
    for (let i = 0; i < numericColumns.length; i++) {
        for (let j = i + 1; j < numericColumns.length; j++) {
            const col1 = numericColumns[i];
            const col2 = numericColumns[j];
            
            // Skip if one of the columns is already marked for removal
            if (columnsToRemove.has(col1.index) || columnsToRemove.has(col2.index)) {
                continue;
            }

            const correlation = calculateCorrelation(col1.values, col2.values);
            
            if (Math.abs(correlation) > args.threshold) {
                // Remove the second column in the pair
                columnsToRemove.add(col2.index);
            }
        }
    }
    
    if (columnsToRemove.size === 0) return data;

    // Filter out the columns
    const newData = data.map(row => {
        return row.filter((_, index) => !columnsToRemove.has(index));
    });

    return newData;
};

/**
 * Applies a list of approved variable changes to the CSV data locally.
 * @param csvContent The current state of the CSV data.
 * @param changes The array of variable suggestions to apply.
 * @returns The modified CSV string.
 */
export const applyVariableChangesLocally = (csvContent: string, changes: VariableSuggestion[]): string => {
  if (!csvContent.trim()) return '';
  let [headers, ...rows] = parseCSV(csvContent);
  const originalHeaders = [...headers]; // Keep a copy to look up original indices

  // Group changes by type to process them in a logical and safe order
  const removals = changes.filter(c => c.suggestionType === 'REMOVE_COLUMN');
  const renames = changes.filter(c => c.suggestionType === 'RENAME');
  const typeChanges = changes.filter(c => c.suggestionType === 'CHANGE_TYPE');
  
  // 1. Process Type Changes first, as they only affect cell content, not structure.
  // They use original column names to find the right index.
  typeChanges.forEach(change => {
    const colIndex = findColumnIndex(originalHeaders, change.columnName);
    if (colIndex !== -1 && change.parameters.newType === 'number') {
        rows.forEach(row => {
          if (row[colIndex]) {
            // Remove non-numeric characters, preserving the decimal point and negative sign.
            row[colIndex] = row[colIndex].replace(/[^0-9.-]/g, '');
          }
        });
    }
  });

  // 2. Process Renames next.
  // Also uses original column names to find index, but modifies the live `headers` array.
  renames.forEach(change => {
    const colIndex = findColumnIndex(originalHeaders, change.columnName);
    if (colIndex !== -1 && change.parameters.newName) {
      headers[colIndex] = change.parameters.newName;
    }
  });

  // 3. Process Removals last, as this is a destructive action that changes the data structure.
  const originalIndicesToRemove = new Set<number>();
  removals.forEach(change => {
      const colIndex = findColumnIndex(originalHeaders, change.columnName);
      if (colIndex !== -1) {
          originalIndicesToRemove.add(colIndex);
      }
  });

  if (originalIndicesToRemove.size > 0) {
    const filterFn = (_: string, index: number) => !originalIndicesToRemove.has(index);
    headers = headers.filter(filterFn);
    rows = rows.map(row => row.filter(filterFn));
  }
  
  return serializeCSV([headers, ...rows]);
};