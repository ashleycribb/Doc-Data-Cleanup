import { FunctionDeclaration, Type } from '@google/genai';

export const dataCleaningTools: FunctionDeclaration[] = [
  {
    name: 'trim_whitespace',
    description: 'Trims leading and trailing whitespace from all cells in the dataset. Should generally be run first.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    }
  },
  {
    name: 'remove_duplicate_rows',
    description: 'Removes rows that are complete duplicates of another row. This should be run after initial normalization like trimming whitespace.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    }
  },
  {
    name: 'standardize_capitalization',
    description: 'Corrects inconsistent capitalization in a specified categorical column.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        columnName: {
          type: Type.STRING,
          description: 'The header name of the column to standardize.'
        }
      },
      required: ['columnName']
    }
  },
  {
    name: 'impute_missing_numeric',
    description: 'Fills missing numerical values in a column with the mean or median of that column.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        columnName: {
          type: Type.STRING,
          description: 'The header name of the numeric column with missing values.'
        },
        method: {
          type: Type.STRING,
          description: 'The imputation method to use.',
          enum: ['mean', 'median']
        }
      },
      required: ['columnName', 'method']
    }
  },
  {
    name: 'impute_missing_categorical',
    description: 'Fills missing or placeholder categorical/text values with a specified string, like "Unknown".',
    parameters: {
      type: Type.OBJECT,
      properties: {
        columnName: {
          type: Type.STRING,
          description: 'The header name of the categorical column with missing values.'
        },
        value: {
          type: Type.STRING,
          description: 'The string value to fill missing cells with. Defaults to "Unknown".'
        }
      },
      required: ['columnName', 'value']
    }
  },
  {
    name: 'discretize_column',
    description: 'Converts a continuous numerical column into a new categorical column with a specified number of bins using a given method. Adds a new column named "[columnName]_discretized".',
    parameters: {
      type: Type.OBJECT,
      properties: {
        columnName: {
          type: Type.STRING,
          description: 'The header name of the numerical column to discretize.'
        },
        method: {
          type: Type.STRING,
          description: 'The binning strategy.',
          enum: ['equal-width', 'equal-frequency']
        },
        bins: {
          type: Type.INTEGER,
          description: 'The number of discrete bins to create (e.g., 3 for "Low", "Medium", "High").'
        }
      },
      required: ['columnName', 'method', 'bins']
    }
  },
  {
    name: 'normalize_column',
    description: 'Performs min-max normalization on a numerical column, scaling all its values to a range of [0, 1]. Adds a new column named "[columnName]_normalized".',
    parameters: {
      type: Type.OBJECT,
      properties: {
        columnName: {
          type: Type.STRING,
          description: 'The header name of the numerical column to normalize.'
        }
      },
      required: ['columnName']
    }
  },
  {
    name: 'select_features_by_correlation',
    description: 'Removes one of any two numerical columns whose Pearson correlation coefficient is higher than the specified threshold, helping to reduce redundancy.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        threshold: {
          type: Type.NUMBER,
          description: 'The absolute correlation coefficient threshold (e.g., 0.9). If abs(corr(A, B)) > threshold, one column will be removed.'
        }
      },
      required: ['threshold']
    }
  },
  {
    name: 'semantic_clean_column',
    description: 'Uses an LLM to identify and fix semantic inconsistencies in a column (e.g., merging "NYC" and "New York", fixing common typos that regex can\'t catch).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        columnName: {
          type: Type.STRING,
          description: 'The header name of the column to semantically clean.'
        },
        instruction: {
          type: Type.STRING,
          description: 'A brief instruction for the cleanup (e.g., "Standardize US state abbreviations to full names").'
        }
      },
      required: ['columnName', 'instruction']
    }
  },
  {
    name: 'mask_sensitive_pii',
    description: 'Identifies and masks Personally Identifiable Information (PII) like full names, emails, or phone numbers in a specific column or the entire dataset.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        columnName: {
          type: Type.STRING,
          description: 'The header name of the column to mask. If omitted, the AI will attempt to find and mask all sensitive columns.'
        }
      }
    }
  },
  {
    name: 'provide_cleaning_summary',
    description: 'Provides a human-readable summary of the cleaning plan. This function must be called exactly once after all other cleaning tools have been called.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        summary_steps: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: "A single step in the cleaning summary, e.g., \"Trim whitespace from all cells\"."
          },
          description: "An array of strings, where each string is a brief, human-readable description of a cleaning action in the plan."
        }
      },
      required: ['summary_steps']
    }
  }
];