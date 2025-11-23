

import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisSuggestion, Difficulty, CleanedDataResult, ChatMessage, ChatAgentResponse, AnalysisResult, VariableSuggestion } from '../types';
import { Difficulty as DifficultyEnum } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = "gemini-2.5-flash";

/**
 * Parses a caught error from the Gemini API and returns a user-friendly message.
 * @param error The error object caught in a try-catch block.
 * @returns A string containing a more specific, user-friendly error message.
 */
const parseGeminiError = (error: unknown): string => {
    // Check if it's an object with a message property
    if (typeof error === 'object' && error !== null && 'message' in error) {
        const message = (error as { message: string }).message.toLowerCase();

        if (message.includes('api key not valid')) {
            return "Invalid API Key. Please ensure your API key is configured correctly.";
        }
        if (message.includes('rate limit')) {
            return "You've sent too many requests. Please wait a moment and try again.";
        }
        if (message.includes('candidate was blocked due to safety')) {
             return "The request was blocked due to safety settings. Please modify your input.";
        }
         if (message.includes('user location is not supported')) {
            return "The API is not available in your region.";
        }
        if (message.includes('500') || message.includes('service unavailable')) {
            return "The Gemini API is currently unavailable. Please try again later.";
        }
    }
    // Generic fallback
    return "An unexpected error occurred with the Gemini API. Check the console for details.";
};


/**
 * Uses Gemini to analyze, convert, and clean data in a single pass.
 * @param fileContent The raw string content of the uploaded file.
 * @param fileName The name of the file, for context.
 * @param difficulty The selected cleaning difficulty.
 * @returns A promise that resolves to an object containing the cleaned CSV and a summary of actions.
 */
export const processAndCleanData = async (fileContent: string, fileName: string, difficulty: Difficulty): Promise<CleanedDataResult> => {
    const instructionsMap = {
        [DifficultyEnum.EASY]: `
            - Trim leading/trailing whitespace from all cells.
            - Ensure consistent row lengths by adding empty fields if necessary for jagged rows.
        `,
        [DifficultyEnum.MEDIUM]: `
            - Standardize date formats to YYYY-MM-DD.
            - Correct inconsistent capitalization in categorical columns (e.g., "usa", "USA", "U.S.A." should all become "USA").
            - For any missing numerical values, fill them with the statistical mean of their respective column.
            - For any categorical/text values that are missing or clearly placeholder (e.g., "N/A", "null"), fill them with the string "Unknown".
            - Trim leading/trailing whitespace from all cells.
        `,
        [DifficultyEnum.HARD]: `
            - Perform all 'Medium' level tasks: Standardize dates, correct capitalization, fill missing values (using mean for numeric, 'Unknown' for categorical), and trim whitespace.
            - Identify and handle potential outliers in numerical columns. A reasonable approach is to cap extreme values at the 99th percentile for that column.
            - If you detect any rows that are complete duplicates of another row, remove the duplicate.
            - For missing numerical values, attempt a more sophisticated imputation if possible (e.g., using a linear regression based on another highly correlated column). If not feasible, fall back to the column mean.
        `,
    };

    const prompt = `
You are an expert, automated data processing and cleaning API. Your task is to take raw data from a file, convert it to a standard CSV format if necessary, clean it based on a specified difficulty level, and provide a summary of the actions taken.

Data comes from a file named: "${fileName}".
Cleaning Difficulty Level: ${difficulty}

**Instructions:**

1.  **Analyze & Convert**: First, examine the structure of the provided data. If it is not already a valid, well-structured CSV with a header row (e.g., it is JSON, XML, or unstructured text), convert it into a logical CSV structure. Infer a sensible header row if one is not present.
2.  **Clean**: Once the data is in CSV format, perform the following cleaning actions based on the difficulty level:
    ${instructionsMap[difficulty]}
3.  **Respond**: Your response MUST be a JSON object with two keys:
    a.  \`cleanedCsv\`: A string containing the final, raw, cleaned CSV data. Do not include markdown.
    b.  \`summary\`: An array of strings, where each string is a brief description of a specific action you performed (both conversion and cleaning actions, e.g., "Converted JSON data to CSV format.", "Standardized date formats in 'order_date' column to YYYY-MM-DD.").

Raw data to process:
---
${fileContent}
---
`;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            cleanedCsv: {
                type: Type.STRING,
                description: "The fully cleaned CSV data as a single string."
            },
            summary: {
                type: Type.ARRAY,
                items: {
                    type: Type.STRING,
                    description: "A description of a cleaning action performed."
                },
                description: "A list of all cleaning actions that were performed on the data."
            }
        },
        required: ["cleanedCsv", "summary"]
    };

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as CleanedDataResult;
    } catch (error) {
        console.error("Error in processAndCleanData:", error);
        throw new Error(parseGeminiError(error));
    }
};

/**
 * Uses Gemini to suggest optimizations for the data schema (columns).
 * @param csvContent The cleaned data in CSV format.
 * @returns A promise that resolves to an array of variable suggestions.
 */
export const suggestVariableOptimizations = async (csvContent: string): Promise<VariableSuggestion[]> => {
    const prompt = `
      You are an expert data scientist providing advice on data preparation.
      Based on the provided CSV data snippet, suggest improvements to the data's schema (the columns).

      Instructions:
      1.  Analyze the column headers and the first few rows to infer data types and meanings.
      2.  Suggest 2-4 high-impact improvements. Focus on:
          *   **Renaming:** Make column names clearer and more consistent (e.g., 'prod_id' to 'ProductID', use camelCase or snake_case consistently).
          *   **Type Conversion:** Identify columns that are stored as text but should be numeric, date, etc. (e.g., a '$1,200.50' column should be a number).
          *   **Redundancy:** Suggest removing columns that are empty, useless, or redundant.
      3.  For each suggestion, provide the current column name, the type of suggestion, a clear description of the change and why it's beneficial, and the parameters for the change (like a new name or new data type).
      4.  Return ONLY the JSON array of suggestions.

      Data Snippet:
      ---
      ${csvContent.split('\n').slice(0, 10).join('\n')}
      ---
    `;

    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          columnName: {
            type: Type.STRING,
            description: "The name of the column to be modified."
          },
          suggestionType: {
            type: Type.STRING,
            description: "The type of change suggested, e.g., 'RENAME', 'CHANGE_TYPE', 'REMOVE_COLUMN'."
          },
          description: {
            type: Type.STRING,
            description: "A brief, user-friendly explanation of the suggestion."
          },
          parameters: {
            type: Type.OBJECT,
            properties: {
              newName: { type: Type.STRING },
              newType: { type: Type.STRING },
            },
            description: "Parameters needed to execute the change."
          }
        },
        required: ["columnName", "suggestionType", "description", "parameters"]
      }
    };
      
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as VariableSuggestion[];
    } catch (error) {
        console.error("Error in suggestVariableOptimizations:", error);
        throw new Error(parseGeminiError(error));
    }
};

/**
 * Applies a list of approved variable changes to the CSV data.
 * @param csvContent The current state of the CSV data.
 * @param changes The array of variable suggestions to apply.
 * @returns A promise that resolves to the modified CSV string.
 */
export const applyVariableChanges = async (csvContent: string, changes: VariableSuggestion[]): Promise<string> => {
    const prompt = `
      You are a data processing engine. Your task is to apply a series of transformations to the provided CSV data.

      Transformations to perform:
      ---
      ${JSON.stringify(changes, null, 2)}
      ---

      Instructions:
      1.  Read the list of transformations.
      2.  Apply each transformation to the full CSV data provided below.
      3.  For 'CHANGE_TYPE' to 'number', remove any non-numeric characters (like '$', ',').
      4.  Return ONLY the complete, raw, updated CSV data. Do not include any other text or markdown.

      Full CSV Data:
      ---
      ${csvContent}
      ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error in applyVariableChanges:", error);
        throw new Error(parseGeminiError(error));
    }
};

/**
 * Uses Gemini to suggest statistical analyses based on the provided data.
 * @param csvContent The cleaned data in CSV format.
 * @returns A promise that resolves to an array of analysis suggestions.
 */
export const suggestAnalyses = async (csvContent: string): Promise<AnalysisSuggestion[]> => {
    const prompt = `
      You are an expert academic research assistant, similar to a consultant who helps design statistical studies.
      Based on the column headers and the first few rows of the provided CSV data, your task is to suggest potential statistical analyses that could yield meaningful insights for academic research.

      Instructions:
      1.  Analyze the provided data snippet to understand the variable types (e.g., categorical, numerical, date).
      2.  Suggest 3 to 4 distinct and relevant statistical analyses.
      3.  For each suggestion, provide a name for the analysis, a description of what insights it might reveal from this specific dataset, and a general type (e.g., "Descriptive", "Inferential", "Relational").
      4.  Ensure your suggestions are practical and commonly used in academic papers.
      5.  Return ONLY the JSON array of suggestions.

      Data Snippet:
      ---
      ${csvContent.split('\n').slice(0, 10).join('\n')}
      ---
    `;

    const responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "The common name of the statistical analysis (e.g., 'T-Test', 'ANOVA', 'Correlation Matrix')."
            },
            description: {
              type: Type.STRING,
              description: "A brief explanation of what this analysis would uncover in the context of the provided data."
            },
            type: {
              type: Type.STRING,
              description: "The general category of the analysis (e.g., 'Descriptive', 'Inferential', 'Predictive')."
            }
          },
          required: ["name", "description", "type"]
        }
      };
      
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as AnalysisSuggestion[];
    } catch (error) {
        console.error("Error in suggestAnalyses:", error);
        throw new Error(parseGeminiError(error));
    }
};


/**
 * Sends a message to the data agent to manipulate or query the data.
 * @param currentCsv The current state of the CSV data.
 * @param chatHistory The history of the conversation for context.
 * @param newMessage The new user message/command.
 * @returns A promise resolving to a ChatAgentResponse object.
 */
export const chatWithDataAgent = async (
    currentCsv: string,
    chatHistory: ChatMessage[],
    newMessage: string
): Promise<ChatAgentResponse> => {
    const historySnippet = chatHistory.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n');

    const prompt = `
You are an expert data analysis AI assistant. Your role is to help a user analyze and manipulate a dataset through conversation. You have two primary functions: Data Manipulation and Data Analysis.

Current Chat History (for context):
---
${historySnippet}
---

User's New Request: "${newMessage}"

The full current dataset is below. Use it to fulfill the user's request.
---
${currentCsv}
---

**Function Instructions:**

1.  **Data Manipulation**:
    *   **Task**: If the user asks to CHANGE the data (e.g., "remove column X", "filter rows where Y > 10", "rename column A to B"), perform the modification on the CSV.
    *   **JSON Output**:
        *   \`updatedCsv\`: MUST contain the complete, raw CSV data AFTER the change.
        *   \`responseText\`: A user-friendly message explaining the change (e.g., "I have removed the 'price' column.").
        *   \`analysisResult\`: This key MUST be omitted from the JSON object.

2.  **Data Analysis**:
    *   **Task**: If the user asks a QUESTION about the data (e.g., "summarize column X", "what is the sentiment of column Y?"), perform the analysis.
    *   **JSON Output**:
        *   \`updatedCsv\`: MUST contain the original, UNCHANGED CSV data.
        *   \`responseText\`: A user-friendly message summarizing the analysis findings.
        *   \`analysisResult\`: A structured JSON object representing the analysis. The object MUST have an \`analysisType\` key and other keys specific to the analysis performed.

**Available Analysis Tools & Required \`analysisResult\` Structures:**

*   **Descriptive Statistics** (keywords: summarize, describe, statistics, mean, median, mode)
    *   \`analysisType\`: "STATISTICS"
    *   \`targetColumn\`: The column being analyzed.
    *   \`metrics\`: An object with keys like \`mean\`, \`median\`, \`stdDev\`, \`min\`, \`max\`, \`count\`.

*   **Correlation Analysis** (keywords: correlate, relationship, connection)
    *   \`analysisType\`: "CORRELATION"
    *   \`correlations\`: An array of objects, each with \`{ column1, column2, correlation }\`. Find the top 3-5 most significant correlations.

*   **Sentiment Analysis** (keywords: sentiment, feeling, opinion, emotion)
    *   \`analysisType\`: "SENTIMENT"
    *   \`targetColumn\`: The text column being analyzed.
    *   \`averageScore\`: A single sentiment score from -1 (very negative) to 1 (very positive).
    *   \`positive\`, \`negative\`, \`neutral\`: Percentages (0 to 1) for each category.

*   **Frequency Distribution** (keywords: frequency, count, breakdown, top, most common)
    *   \`analysisType\`: "FREQUENCY"
    *   \`targetColumn\`: The categorical column being analyzed.
    *   \`distribution\`: An array of objects \`{ category, count, percentage }\`, sorted from most to least frequent.

*   **Thematic Analysis / Topic Modeling** (keywords: topics, themes, subjects, keywords)
    *   \`analysisType\`: "TOPICS"
    *   \`targetColumn\`: The text column for topic modeling.
    *   \`topics\`: An array of objects \`{ topic, keywords }\`. Identify 3-5 main topics.

*   **Trend Analysis** (keywords: trend, growth, over time, evolution)
    *   \`analysisType\`: "TREND"
    *   \`targetColumn\`: The numerical column to analyze.
    *   \`timeColumn\`: The date/time column for the x-axis.
    *   \`trendData\`: An array of \`{ date, value }\` objects, sorted by date.
    *   \`slope\`: The calculated slope of the trend line (a positive number indicates growth).
    *   \`interpretation\`: A brief text summary of the trend.

*   **Anomaly Detection** (keywords: anomalies, outliers, unusual values)
    *   \`analysisType\`: "ANOMALY_DETECTION"
    *   \`targetColumn\`: The column to check for anomalies.
    *   \`anomalies\`: An array of objects \`{ value, rowIndex, reason }\`. The \`reason\` should explain why it's an anomaly (e.g., "3 standard deviations from mean"). Find up to 5 most significant anomalies.

**Final Output Requirement:**
Your entire response MUST be a single, well-formed JSON object matching the schema. Do not include any text outside the JSON object.
`;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            updatedCsv: {
                type: Type.STRING,
                description: "The full, raw CSV data, either modified (for manipulation) or original (for analysis)."
            },
            responseText: {
                type: Type.STRING,
                description: "The natural language response to the user explaining the action or findings."
            },
            analysisResult: {
                type: Type.OBJECT,
                description: "The structured result of a data analysis. This key should be omitted if a data manipulation was performed.",
                properties: {
                    analysisType: { type: Type.STRING },
                    targetColumn: { type: Type.STRING },
                }
            }
        },
        required: ["updatedCsv", "responseText"]
    };

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ChatAgentResponse;
    } catch (error) {
        console.error("Error in chatWithDataAgent:", error);
        throw new Error(parseGeminiError(error));
    }
};
