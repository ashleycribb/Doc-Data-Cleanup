
import React, { useState, useCallback, useEffect } from 'react';
import { DataSourceSelector } from '../components/DataSourceSelector';
import { StatusTracker } from '../components/StatusTracker';
import { ActionButtons } from '../components/ActionButtons';
import { Header } from '../components/Header';
import { AnalysisSuggestions } from '../components/AnalysisSuggestions';
import { DifficultySelector } from '../components/DifficultySelector';
import { FileManager } from '../components/FileManager';
import { ChatAgent } from '../components/ChatAgent';
import { LogoIcon } from '../components/icons/LogoIcon';
import { VariableManager } from '../components/VariableManager';
import { 
  generateCleaningPlan,
  suggestAnalyses, 
  chatWithDataAgent,
  suggestVariableOptimizations
} from './services/geminiService';
import * as DataCleaner from './services/dataCleaningService';
import { trackEvent } from './services/analyticsService';
import * as DriveService from './services/googleDriveService';
import type { ProcessStep, AnalysisSuggestion, Difficulty, ChatMessage, VariableSuggestion, AnalysisResult } from '../types';
import { ProcessStatus } from '../types';
import { Difficulty as DifficultyEnum } from '../types';
import { Modal } from '../components/Modal';
import type { FunctionCall } from '@google/genai';

const App: React.FC = () => {
  const initialSteps: ProcessStep[] = [
    { name: 'Upload Data', status: ProcessStatus.PENDING, details: 'Waiting for file...' },
    { name: 'Generate Cleaning Plan', status: ProcessStatus.PENDING, details: 'AI will create a plan.' },
    { name: 'Execute Cleaning Plan', status: ProcessStatus.PENDING, details: 'Locally apply cleaning steps.' },
    { name: 'Process Complete', status: ProcessStatus.PENDING, details: 'Data is prepared for insights.' },
  ];

  const [file, setFile] = useState<File | null>(null);
  const [originalData, setOriginalData] = useState<string>('');
  const [cleanedData, setCleanedData] = useState<string>('');
  const [cleaningSummary, setCleaningSummary] = useState<string[]>([]);
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>(initialSteps);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<Difficulty>(DifficultyEnum.MEDIUM);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  
  // Variable Optimization State
  const [variableSuggestions, setVariableSuggestions] = useState<VariableSuggestion[]>([]);
  const [isSuggestingVariables, setIsSuggestingVariables] = useState<boolean>(false);
  const [isApplyingVariables, setIsApplyingVariables] = useState<boolean>(false);
  const [hasOptimized, setHasOptimized] = useState<boolean>(false);

  // Analysis State
  const [analysisSuggestions, setAnalysisSuggestions] = useState<AnalysisSuggestion[]>([]);
  const [isSuggestingAnalysis, setIsSuggestingAnalysis] = useState<boolean>(false);

  // Chat Agent State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState<boolean>(false);

  // Feedback State for Drive Save
  const [driveFeedback, setDriveFeedback] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Modal State
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);

  // Google Drive State
  const [isDriveReady, setIsDriveReady] = useState<boolean>(false);

  useEffect(() => {
    const initDrive = async () => {
        try {
            await DriveService.initGoogleDrive();
            setIsDriveReady(DriveService.isGoogleConfigured());
        } catch (e) {
            console.error("Failed to initialize Google Drive:", e);
        }
    };
    initDrive();
  }, []);

  // Effect to clear feedback messages after a delay
  useEffect(() => {
    if (driveFeedback) {
        const timer = setTimeout(() => {
            setDriveFeedback(null);
        }, 5000); // Message disappears after 5 seconds
        return () => clearTimeout(timer);
    }
  }, [driveFeedback]);


  const updateStepStatus = useCallback((stepIndex: number, status: ProcessStatus, details?: string) => {
    setProcessSteps(prevSteps => {
      const newSteps = [...prevSteps];
      if (newSteps[stepIndex]) {
        newSteps[stepIndex] = { ...newSteps[stepIndex], status, details: details ?? newSteps[stepIndex].details };
      }
      return newSteps;
    });
  }, []);

  const handleReset = useCallback(() => {
    setFile(null);
    setOriginalData('');
    setCleanedData('');
    setCleaningSummary([]);
    setProcessSteps(initialSteps);
    setIsLoading(false);
    setIsSavingToDrive(false);
    setError(null);
    setIsDone(false);
    setAnalysisSuggestions([]);
    setIsSuggestingAnalysis(false);
    setVariableSuggestions([]);
    setIsSuggestingVariables(false);
    setIsApplyingVariables(false);
    setHasOptimized(false);
    setChatHistory([]);
    setIsChatting(false);
    setDifficulty(DifficultyEnum.MEDIUM);
    setDriveFeedback(null);
    setProgressPercent(0);
  }, [initialSteps]);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      const validTypes = ['csv', 'json', 'txt'];
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      
      if (!fileExtension || !validTypes.includes(fileExtension)) {
          setError(`Invalid file type. Supported formats are: ${validTypes.join(', ').toUpperCase()}`);
          return;
      }

      trackEvent('data_source_selected', { source: 'upload' });
      handleReset();
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setOriginalData(text);
        updateStepStatus(0, ProcessStatus.COMPLETED, `File "${selectedFile.name}" uploaded successfully.`);
      };
      reader.onerror = () => {
        setError('Failed to read the file.');
        updateStepStatus(0, ProcessStatus.FAILED, 'Error reading file.');
      };
      reader.readAsText(selectedFile);
    }
  };

  const handlePaste = (pastedText: string) => {
    trackEvent('data_source_selected', { source: 'paste' });
    handleReset();
    const fileName = 'pasted_data.txt';
    setOriginalData(pastedText);
    const mockFile = new File([pastedText], fileName, { type: "text/plain" });
    setFile(mockFile);
    updateStepStatus(0, ProcessStatus.COMPLETED, `Data source "${fileName}" loaded successfully.`);
  };

  const handleDriveSelect = async () => {
      if (!isDriveReady) {
          setError("Google Drive is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_API_KEY to your environment.");
          return;
      }
      
      try {
          const { content, name } = await DriveService.pickFileFromDrive();
          trackEvent('data_source_selected', { source: 'drive' });
          handleReset();
          setOriginalData(content);
          const mockFile = new File([content], name, { type: "text/plain" });
          setFile(mockFile);
          updateStepStatus(0, ProcessStatus.COMPLETED, `Imported "${name}" from Google Drive.`);
      } catch (e: any) {
          if (e !== 'Selection cancelled') {
              console.error(e);
              setError(`Failed to load from Drive: ${e.message || e}`);
          }
      }
  };

  // Maps function names from Gemini to our local functions
  const toolbelt: { [key: string]: (data: string[][], args: any) => string[][] } = {
    'trim_whitespace': DataCleaner.trimWhitespace,
    'remove_duplicate_rows': DataCleaner.removeDuplicateRows,
    'standardize_capitalization': DataCleaner.standardizeCapitalization,
    'impute_missing_numeric': DataCleaner.imputeMissingNumeric,
    'impute_missing_categorical': DataCleaner.imputeMissingCategorical,
    'discretize_column': DataCleaner.discretizeColumn,
    'normalize_column': DataCleaner.normalizeColumn,
    'select_features_by_correlation': DataCleaner.selectFeaturesByCorrelation,
  };

  const executePlan = (plan: FunctionCall[], data: string[][], onProgress: (message: string) => void): string[][] => {
    let currentData = data;
    const totalSteps = plan.length;
    plan.forEach((step, index) => {
      const tool = toolbelt[step.name];
      if (tool) {
        onProgress(`Executing: ${step.name.replace(/_/g, ' ')}... (${index + 1}/${totalSteps})`);
        try {
          currentData = tool(currentData, step.args);
        } catch (e) {
          console.error(`Error executing tool: ${step.name}`, e);
          if (e instanceof Error) {
            throw e;
          }
          throw new Error(`An unknown error occurred during local execution of "${step.name}".`);
        }
      } else {
        console.warn(`Unknown tool in plan: ${step.name}`);
      }
    });
    return currentData;
  };

  const handleStartCleanup = async () => {
    if (!originalData) {
      setError('No data to clean. Please upload a file first.');
      return;
    }
    
    const startTime = Date.now();
    
    setIsLoading(true);
    setError(null);
    setIsDone(false);
    setAnalysisSuggestions([]);
    setVariableSuggestions([]);
    setHasOptimized(false);
    setProgressPercent(0);

    const initialChatMessage: ChatMessage = {
        role: 'model',
        content: "Your data is clean and ready. How can I help you analyze it?\n\nYou can ask me things like:\n• _\"Summarize the 'price' column.\"_\n• _\"Show me the top 5 product categories by frequency.\"_\n• _\"What is the sentiment of the reviews?\"_",
        analysisResult: null
    };
    setChatHistory([initialChatMessage]);
    trackEvent('cleanup_started', { difficulty });

    try {
      // Step 1: Generate Cleaning Plan
      updateStepStatus(1, ProcessStatus.IN_PROGRESS, `Gemini is creating a cleaning plan (${difficulty} level)...`);
      setProgressPercent(25);
      const { plan, summary } = await generateCleaningPlan(originalData, difficulty);
      setCleaningSummary(summary);
      updateStepStatus(1, ProcessStatus.COMPLETED, 'AI cleaning plan generated.');
      setProgressPercent(50);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 2: Execute Cleaning Plan Locally
      updateStepStatus(2, ProcessStatus.IN_PROGRESS, 'Applying cleaning steps locally...');
      
      const parsedData = DataCleaner.parseCSV(originalData);
      const cleanedParsedData = executePlan(plan, parsedData, (message) => {
        updateStepStatus(2, ProcessStatus.IN_PROGRESS, message);
      });
      const finalCsv = DataCleaner.serializeCSV(cleanedParsedData);

      setCleanedData(finalCsv);
      updateStepStatus(2, ProcessStatus.COMPLETED, 'Local data cleaning finished.');
      setProgressPercent(100);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Step 3: Complete
      updateStepStatus(3, ProcessStatus.COMPLETED, 'Data is ready for download or further analysis.');
      setIsDone(true);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Cleanup Failed: ${errorMessage}`);
      const currentStepIndex = processSteps.findIndex(s => s.status === ProcessStatus.IN_PROGRESS);
      if (currentStepIndex !== -1) {
        updateStepStatus(currentStepIndex, ProcessStatus.FAILED, errorMessage);
      }
      setProgressPercent(0);
    } finally {
      setIsLoading(false);
      const duration = Date.now() - startTime;
      trackEvent('cleanup_completed', { durationMs: duration });
    }
  };
  
  const handleDownload = () => {
    if (!cleanedData) return;
    trackEvent('data_downloaded');
    const blob = new Blob([cleanedData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const originalFilename = file?.name.split('.').slice(0, -1).join('.') || 'data';
    link.setAttribute('download', `${originalFilename}${hasOptimized ? '_optimized' : ''}_cleaned.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveToDrive = async () => {
    if (!cleanedData) return;
    if (!isDriveReady) {
        setError("Google Drive is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_API_KEY to your environment.");
        return;
    }

    setIsSavingToDrive(true);
    setError(null);
    setDriveFeedback({ message: "Authenticating and uploading to Google Drive...", type: 'info' });

    try {
      const originalFilename = file?.name.split('.').slice(0, -1).join('.') || 'data';
      const fileName = `${originalFilename}${hasOptimized ? '_optimized' : ''}_cleaned.csv`;
      
      await DriveService.saveFileToDrive(cleanedData, fileName);
      
      trackEvent('data_saved_to_drive');
      setDriveFeedback({ message: `File "${fileName}" saved successfully to your Drive.`, type: 'success' });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to save to Google Drive: ${errorMessage}`);
      setDriveFeedback(null);
    } finally {
      setIsSavingToDrive(false);
    }
  };

  const handleSuggestVariableOptimizations = async () => {
    if (!cleanedData) {
        setError('No cleaned data available to analyze.');
        return;
    }
    trackEvent('variable_suggestions_generated');
    setIsSuggestingVariables(true);
    setError(null);
    try {
        const suggestions = await suggestVariableOptimizations(cleanedData);
        setVariableSuggestions(suggestions);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(`An error occurred while suggesting variable optimizations: ${errorMessage}`);
    } finally {
        setIsSuggestingVariables(false);
    }
  };

  const handleApplyVariableChanges = (suggestionsToApply: VariableSuggestion[]) => {
    if (!cleanedData || suggestionsToApply.length === 0) return;
    trackEvent('variable_changes_applied', { changesCount: suggestionsToApply.length });
    
    setIsApplyingVariables(true);
    setError(null);
    try {
      const updatedCsv = DataCleaner.applyVariableChangesLocally(cleanedData, suggestionsToApply);
      setCleanedData(updatedCsv);
      setVariableSuggestions([]);
      setHasOptimized(true);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`An error occurred while applying variable changes: ${errorMessage}`);
    } finally {
      setIsApplyingVariables(false);
    }
  };

  const handleSuggestAnalysis = async () => {
    if (!cleanedData) {
        setError('No cleaned data available to analyze.');
        return;
    }
    trackEvent('analysis_suggestions_generated');
    setIsSuggestingAnalysis(true);
    setError(null);
    try {
        const suggestions = await suggestAnalyses(cleanedData);
        setAnalysisSuggestions(suggestions);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(`An error occurred while suggesting analyses: ${errorMessage}`);
    } finally {
        setIsSuggestingAnalysis(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    trackEvent('chat_message_sent');

    const newUserMessage: ChatMessage = { role: 'user', content: message, analysisResult: null };
    const updatedHistory = [...chatHistory, newUserMessage];
    setChatHistory(updatedHistory);
    setIsChatting(true);
    setError(null);

    try {
        const agentResponse = await chatWithDataAgent(cleanedData, updatedHistory, message);
        setCleanedData(agentResponse.updatedCsv);
        setChatHistory(prev => [...prev, { 
            role: 'model', 
            content: agentResponse.responseText,
            analysisResult: agentResponse.analysisResult ?? null
        }]);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(`An error occurred while chatting with the agent: ${errorMessage}`);
        setChatHistory(chatHistory);
    } finally {
        setIsChatting(false);
    }
};

  const isBusy = isLoading || isSavingToDrive || isSuggestingAnalysis || isChatting || isSuggestingVariables || isApplyingVariables;

  return (
    <div className="min-h-screen bg-brand-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-7xl mx-auto">
        <Header 
          onHelpClick={() => setIsHelpModalOpen(true)}
          onAboutClick={() => setIsAboutModalOpen(true)}
        />
        <main className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col space-y-6">
            <DataSourceSelector
              onFileChange={handleFileChange}
              onPaste={handlePaste}
              onDriveSelect={handleDriveSelect}
              disabled={isBusy}
              file={file}
            />
            <DifficultySelector
              selectedDifficulty={difficulty}
              onDifficultyChange={setDifficulty}
              disabled={isBusy}
            />
            <ActionButtons
              isReadyToClean={!!file && !isLoading && !isDone}
              isCleaning={isLoading}
              isDone={isDone}
              onStart={handleStartCleanup}
              onDownload={handleDownload}
              onReset={handleReset}
              hasOptimized={hasOptimized}
            />
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
                <strong className="font-bold">Error:</strong>
                <span className="block sm:inline ml-2">{error}</span>
              </div>
            )}
             <StatusTracker steps={processSteps} progress={progressPercent} isLoading={isLoading} />
          </div>
          <div className="flex flex-col space-y-6">
            {isDone ? (
                <>
                    <FileManager
                        originalFile={file}
                        originalData={originalData}
                        cleanedData={cleanedData}
                        cleaningSummary={cleaningSummary}
                        onSaveToDrive={handleSaveToDrive}
                        isSavingToDrive={isSavingToDrive}
                        driveFeedback={driveFeedback}
                        hasOptimized={hasOptimized}
                    />
                    <VariableManager
                      onSuggest={handleSuggestVariableOptimizations}
                      onApply={handleApplyVariableChanges}
                      suggestions={variableSuggestions}
                      isSuggesting={isSuggestingVariables}
                      isApplying={isApplyingVariables}
                      hasOptimized={hasOptimized}
                    />
                    <AnalysisSuggestions 
                        onSuggest={handleSuggestAnalysis}
                        suggestions={analysisSuggestions}
                        isLoading={isSuggestingAnalysis}
                    />
                    <ChatAgent
                        messages={chatHistory}
                        onSendMessage={handleSendMessage}
                        isLoading={isChatting}
                    />
                </>
            ) : (
                <div className="bg-brand-gray-800/50 p-6 rounded-xl shadow-lg h-full min-h-[400px] flex items-center justify-center">
                    <div className="text-center">
                        <LogoIcon className="w-16 h-16 mx-auto text-brand-gray-700"/>
                        <p className="mt-4 text-brand-gray-400">Your results will appear here once the cleanup is complete.</p>
                    </div>
                </div>
            )}
          </div>
        </main>
      </div>
      <Modal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        title="How to Use the Agent"
      >
        <div className="space-y-4 text-sm">
            <p>This agent streamlines the process of cleaning and preparing your data for analysis. Follow these steps:</p>
            <ol className="list-decimal list-inside space-y-3 pl-2">
                <li>
                    <strong className="text-brand-gray-100">Provide Your Data:</strong> Use one of the three methods to load your data. You can upload a file (like CSV, JSON, TXT), paste raw text directly, or import from Google Drive.
                </li>
                <li>
                    <strong className="text-brand-gray-100">Set Cleaning Difficulty:</strong> Choose a level of cleaning intensity. 'Easy' performs basic tasks. 'Hard' may include advanced steps like normalization, discretization, or removing redundant columns based on correlation.
                </li>
                <li>
                    <strong className="text-brand-gray-100">Start Cleanup:</strong> Click the 'Start Cleanup' button. The agent will ask Gemini to create a plan, then execute it locally, showing progress in the 'Agent Status' panel.
                </li>
                <li>
                    <strong className="text-brand-gray-100">Review Results:</strong> Once complete, the right-hand panel will display a summary of the cleaning actions, file details, and options to download or save the cleaned file back to Google Drive.
                </li>
                <li>
                    <strong className="text-brand-gray-100">Optimize Variables:</strong> After cleaning, you can ask the agent to suggest schema optimizations, such as renaming columns or changing data types, and apply them.
                </li>
                <li>
                    <strong className="text-brand-gray-100">Analyze & Chat:</strong> Finally, ask the agent to suggest analyses or chat with it directly to perform further data manipulations and analysis, like "summarize the price column" or "remove rows where stock is 0".
                </li>
            </ol>
        </div>
      </Modal>

      <Modal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        title="About Doc Data Cleanup Agent"
      >
        <div className="space-y-4 text-sm">
            <p>
                The Doc Data Cleanup Agent is an intelligent application designed to automate the tedious process of data preparation. 
                Leveraging the power of Google's Gemini API, this tool can inspect, convert, and clean various data formats, making them ready for analysis.
            </p>
            <p>
                This version integrates directly with Google Drive for seamless importing and exporting of data.
            </p>
            <div className="pt-4 text-xs text-brand-gray-400">
                <p>Version: 2.2.0 (Google Drive Integration)</p>
                <p>Powered by: Google Gemini API & Google Drive API</p>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;
