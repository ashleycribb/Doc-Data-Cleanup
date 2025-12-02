
export enum ProcessStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface ProcessStep {
  name: string;
  status: ProcessStatus;
  details: string;
}

export interface AnalysisSuggestion {
  name: string;
  description: string;
  type: string;
  orangeInstructions?: string;
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
}

export interface CleanedDataResult {
  cleanedCsv: string;
  summary: string[];
}

export interface VariableSuggestion {
  columnName: string;
  suggestionType: 'RENAME' | 'CHANGE_TYPE' | 'REMOVE_COLUMN';
  description: string;
  parameters: {
    newName?: string;
    newType?: 'string' | 'number' | 'date' | 'boolean';
  };
}

// Types for Conversational Analysis
export type AnalysisType = 'STATISTICS' | 'CORRELATION' | 'SENTIMENT' | 'FREQUENCY' | 'TOPICS' | 'TREND' | 'ANOMALY_DETECTION';

export interface StatisticsResult {
  analysisType: 'STATISTICS';
  targetColumn: string;
  metrics: {
    mean?: number;
    median?: number;
    mode?: number | string;
    stdDev?: number;
    min?: number;
    max?: number;
    count: number;
    [key: string]: number | string | undefined;
  };
}

export interface CorrelationResult {
    analysisType: 'CORRELATION';
    correlations: {
      column1: string;
      column2: string;
      correlation: number;
    }[];
}

export interface SentimentResult {
    analysisType: 'SENTIMENT';
    targetColumn: string;
    averageScore: number;
    positive: number;
    negative: number;
    neutral: number;
}

export interface FrequencyResult {
    analysisType: 'FREQUENCY';
    targetColumn: string;
    distribution: {
        category: string;
        count: number;
        percentage: number;
    }[];
}

export interface TopicsResult {
    analysisType: 'TOPICS';
    targetColumn: string;
    topics: {
        topic: string;
        keywords: string[];
    }[];
}

export interface TrendResult {
    analysisType: 'TREND';
    targetColumn: string;
    timeColumn: string;
    trendData: {
        date: string;
        value: number;
    }[];
    slope: number;
    interpretation: string;
}

export interface AnomalyResult {
    analysisType: 'ANOMALY_DETECTION';
    targetColumn: string;
    anomalies: {
        value: number | string;
        rowIndex?: number;
        reason: string;
    }[];
}

export type AnalysisResult = StatisticsResult | CorrelationResult | SentimentResult | FrequencyResult | TopicsResult | TrendResult | AnomalyResult;


export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  analysisResult: AnalysisResult | null;
}

export interface ChatAgentResponse {
  updatedCsv: string;
  responseText: string;
  analysisResult?: AnalysisResult;
}
