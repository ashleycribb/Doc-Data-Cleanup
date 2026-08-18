


// Define the structure for our analytics data
interface AnalyticsData {
  totalSessions: number;
  datasetsProcessed: number;
  totalProcessingTimeMs: number;
  dataSourceCounts: {
    upload: number;
    paste: number;
    drive: number;
  };
  difficultyCounts: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
  chatInteractions: number;
  variableChangesApplied: number;
  analysisSuggestionsGenerated: number;
}

// Type for the summary object that the UI will consume
export interface AnalyticsSummary extends AnalyticsData {
  averageProcessingTimeMs: number;
  mostUsedDataSource: string;
}

const ANALYTICS_KEY = 'docDataCleanupAgentAnalytics';

// Initialize with default values
const getDefaultAnalyticsData = (): AnalyticsData => ({
  totalSessions: 0,
  datasetsProcessed: 0,
  totalProcessingTimeMs: 0,
  dataSourceCounts: { upload: 0, paste: 0, drive: 0 },
  difficultyCounts: { Easy: 0, Medium: 0, Hard: 0 },
  chatInteractions: 0,
  variableChangesApplied: 0,
  analysisSuggestionsGenerated: 0,
});

// Load data from localStorage
const loadAnalyticsData = (): AnalyticsData => {
  try {
    const storedData = localStorage.getItem(ANALYTICS_KEY);
    if (storedData) {
      // Merge with defaults to handle cases where new keys are added
      return { ...getDefaultAnalyticsData(), ...JSON.parse(storedData) };
    }
  } catch (error) {
    console.error("Failed to load analytics data:", error);
  }
  return getDefaultAnalyticsData();
};

// Save data to localStorage
const saveAnalyticsData = (data: AnalyticsData) => {
  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save analytics data:", error);
  }
};

let analyticsData = loadAnalyticsData();

type EventName = 
  | 'session_start'
  | 'data_source_selected'
  | 'cleanup_started'
  | 'cleanup_completed'
  | 'data_downloaded'
  | 'download_orange'
  | 'data_saved_to_drive'
  | 'variable_suggestions_generated'
  | 'variable_changes_applied'
  | 'analysis_suggestions_generated'
  | 'chat_message_sent';

// The main tracking function
export const trackEvent = (eventName: EventName, properties: Record<string, any> = {}) => {
  // Always work with the latest data from storage to avoid race conditions between tabs
  analyticsData = loadAnalyticsData();

  switch (eventName) {
    case 'session_start':
      analyticsData.totalSessions += 1;
      break;
    case 'data_source_selected':
      // Increment the counter for the specified data source (e.g., 'upload', 'paste', 'drive')
      if (properties.source && analyticsData.dataSourceCounts.hasOwnProperty(properties.source)) {
        analyticsData.dataSourceCounts[properties.source as keyof typeof analyticsData.dataSourceCounts] += 1;
      }
      break;
    case 'cleanup_started':
      if (properties.difficulty && analyticsData.difficultyCounts.hasOwnProperty(properties.difficulty)) {
        analyticsData.difficultyCounts[properties.difficulty as keyof typeof analyticsData.difficultyCounts] += 1;
      }
      break;
    case 'cleanup_completed':
      analyticsData.datasetsProcessed += 1;
      if (typeof properties.durationMs === 'number') {
        analyticsData.totalProcessingTimeMs += properties.durationMs;
      }
      break;
    case 'variable_changes_applied':
       if (typeof properties.changesCount === 'number') {
        analyticsData.variableChangesApplied += properties.changesCount;
      }
      break;
    case 'analysis_suggestions_generated':
      analyticsData.analysisSuggestionsGenerated += 1;
      break;
    case 'chat_message_sent':
      analyticsData.chatInteractions += 1;
      break;
    case 'data_downloaded':
    case 'data_saved_to_drive':
        // No specific metric for this yet, but the event is here for future use
        break;
  }
  saveAnalyticsData(analyticsData);
};

// Function to get a computed summary for the UI
export const getAnalyticsSummary = (): AnalyticsSummary => {
  const data = loadAnalyticsData(); // Always load fresh data
  const averageProcessingTimeMs = data.datasetsProcessed > 0 ? data.totalProcessingTimeMs / data.datasetsProcessed : 0;

  const mostUsedDataSource = Object.entries(data.dataSourceCounts).reduce(
    (a, b) => (a[1] > b[1] ? a : b),
    ['N/A', 0]
  )[0];

  return {
    ...data,
    averageProcessingTimeMs,
    mostUsedDataSource,
  };
};

// Function to reset all analytics data
export const resetAnalytics = () => {
  analyticsData = getDefaultAnalyticsData();
  saveAnalyticsData(analyticsData);
};