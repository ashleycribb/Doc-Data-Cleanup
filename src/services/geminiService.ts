


import { GoogleGenAI, Type, FunctionCall } from "@google/genai";
import type { AnalysisSuggestion, Difficulty, ChatMessage, ChatAgentResponse, AnalysisResult, VariableSuggestion } from '../types';
import { dataCleaningTools } from './toolDeclarations';

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
    // Check if it's an object with a message property, which is common for JS errors.
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
        // Fallback for other Gemini-related errors that have a message.
        return `Gemini API Error: ${(error as Error).message}`;
    }
    // Generic fallback for unknown error types.
    return "An unexpected error occurred. Check the console for more details.";
};

/**
 * Uses Gemini to generate a data cleaning plan using Function Calling.
 * @param fileContent The raw string content of the uploaded file.
 * @param difficulty The selected cleaning difficulty.
 * @returns A promise that resolves to an object containing the plan (an array of function calls) and a summary.
 */
export const generateCleaningPlan = async (fileContent: string, difficulty: Difficulty): Promise<{ plan: FunctionCall[], summary: string[] }> => {
    const dataSample = fileContent.split('\n').slice(0, 20).join('\n');

    const prompt = `
You are an expert data cleaning engineer. Your task is to analyze a sample of data and create a step-by-step cleaning plan using the provided tools. The user has specified a difficulty level of "${difficulty}" to guide the thoroughness of your plan.

Based on the data sample, decide which cleaning operations are necessary and in what order they should be performed. For example, you should probably trim whitespace before removing duplicates.

Your response must be a series of tool calls.

First, call the necessary data cleaning tools (like trim_whitespace, remove_duplicate_rows, etc.) in the correct order to form the plan.

Finally, you MUST call the \`provide_cleaning_summary\` tool exactly once. The \`summary_steps\` parameter for this tool should be an array of human-readable strings describing the actions you chose for the cleaning plan.

The user's data sample is:
---
${dataSample}
---
`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                tools: [{ functionDeclarations: dataCleaningTools }],
            },
        });

        const allCalls = response.functionCalls ?? [];
        if (allCalls.length === 0) {
            throw new Error("Gemini did not return a cleaning plan.");
        }

        const summaryCall = allCalls.find(call => call.name === 'provide_cleaning_summary');
        const plan = allCalls.filter(call => call.name !== 'provide_cleaning_summary');
        
        const summary = summaryCall?.args?.summary_steps as string[] ?? ['No summary was provided by the AI.'];

        if (!summaryCall) {
            console.warn("Gemini plan did not include a provide_cleaning_summary call.");
        }
        
        return { plan, summary };

    } catch (error) {
        console.error("Error in generateCleaningPlan:", error);
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
                    timeColumn: { type: Type.STRING },
                    interpretation: { type: Type.STRING },
                    averageScore: { type: Type.NUMBER },
                    positive: { type: Type.NUMBER },
                    negative: { type: Type.NUMBER },
                    neutral: { type: Type.NUMBER },
                    slope: { type: Type.NUMBER },
                    metrics: {
                        type: Type.OBJECT,
                        properties: {
                            mean: { type: Type.NUMBER },
                            median: { type: Type.NUMBER },
                            mode: { type: Type.STRING, description: "Can be number or string, but should be returned as a string." },
                            stdDev: { type: Type.NUMBER },
                            min: { type: Type.NUMBER },
                            max: { type: Type.NUMBER },
                            count: { type: Type.NUMBER },
                        }
                    },
                    correlations: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                column1: { type: Type.STRING },
                                column2: { type: Type.STRING },
                                correlation: { type: Type.NUMBER },
                            }
                        }
                    },
                    distribution: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                category: { type: Type.STRING },
                                count: { type: Type.NUMBER },
                                percentage: { type: Type.NUMBER },
                            }
                        }
                    },
                    topics: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                topic: { type: Type.STRING },
                                keywords: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING }
                                },
                            }
                        }
                    },
                    trendData: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                date: { type: Type.STRING },
                                value: { type: Type.NUMBER },
                            }
                        }
                    },
                    anomalies: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                value: { type: Type.STRING, description: "The anomalous value, which could be a number or text, should be returned as a string." },
                                rowIndex: { type: Type.INTEGER },
                                reason: { type: Type.STRING },
                            }
                        }
                    },
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