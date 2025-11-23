


import React, { useState, useCallback, useEffect } from 'react';
import { DataSourceSelector } from './components/DataSourceSelector';
import { StatusTracker } from './components/StatusTracker';
import { ActionButtons } from './components/ActionButtons';
import { Header } from './components/Header';
import { AnalysisSuggestions } from './components/AnalysisSuggestions';
import { DifficultySelector } from './components/DifficultySelector';
import { FileManager } from './components/FileManager';
import { ChatAgent } from './components/ChatAgent';
import { LogoIcon } from './components/icons/LogoIcon';
// FIX: Import 'processAndCleanData' instead of 'analyzeAndConvertData' and 'cleanData'.
import { processAndCleanData, suggestAnalyses, chatWithDataAgent } from './services/geminiService';
import type { ProcessStep, AnalysisSuggestion, Difficulty, ChatMessage } from './types';
import { ProcessStatus } from './types';
import { Difficulty as DifficultyEnum } from './types';
// FIX: Import Modal component to be used for help and about dialogs.
import { Modal } from './components/Modal';

const App: React.FC = () => {
  // FIX: Updated process steps to reflect the single 'process and clean' step.
  const initialSteps: ProcessStep[] = [
    { name: 'Upload Data', status: ProcessStatus.PENDING, details: 'Waiting for file...' },
    { name: 'Process & Clean Data', status: ProcessStatus.PENDING, details: '' },
    { name: 'Process Complete', status: ProcessStatus.PENDING, details: '' },
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
  // FIX: Added state for progress bar to pass to StatusTracker
  const [progressPercent, setProgressPercent] = useState<number>(0);
  
  // Analysis State
  const [analysisSuggestions, setAnalysisSuggestions] = useState<AnalysisSuggestion[]>([]);
  const [isSuggestingAnalysis, setIsSuggestingAnalysis] = useState<boolean>(false);

  // Chat Agent State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState<boolean>(false);

  // Feedback State for Drive Save
  const [driveFeedback, setDriveFeedback] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // FIX: Added modal state for help and about dialogs.
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);

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
      newSteps[stepIndex] = { ...newSteps[stepIndex], status, details: details ?? newSteps[stepIndex].details };
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
    setChatHistory([]);
    setIsChatting(false);
    setDifficulty(DifficultyEnum.MEDIUM);
    setDriveFeedback(null);
    // FIX: Reset progress percent
    setProgressPercent(0);
  }, [initialSteps]);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
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
    handleReset();
    const fileName = 'pasted_data.txt';
    setOriginalData(pastedText);
    const mockFile = new File([pastedText], fileName, { type: "text/plain" });
    setFile(mockFile);
    updateStepStatus(0, ProcessStatus.COMPLETED, `Data source "${fileName}" loaded successfully.`);
  };

  const handleDriveSelect = (driveData: string, fileName: string) => {
      handleReset();
      setOriginalData(driveData);
      const mockFile = new File([driveData], fileName, { type: "text/plain" });
      setFile(mockFile);
      updateStepStatus(0, ProcessStatus.COMPLETED, `Data source "${fileName}" loaded successfully.`);
  };


  const handleStartCleanup = async () => {
    if (!originalData) {
      setError('No data to clean. Please upload a file first.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setIsDone(false);
    setAnalysisSuggestions([]);
    // FIX: Set progress
    setProgressPercent(0);

    const initialChatMessage: ChatMessage = {
        role: 'model',
        content: "Your data is clean and ready. How can I help you analyze it?\n\nYou can ask me things like:\n• _\"Summarize the 'price' column.\"_\n• _\"Show me the top 5 product categories by frequency.\"_\n• _\"What is the sentiment of the reviews?\"_",
        analysisResult: null
    };
    setChatHistory([initialChatMessage]);

    // FIX: Refactored to use the single 'processAndCleanData' function and updated step logic.
    try {
      // Step 1: Process & Clean Data
      updateStepStatus(1, ProcessStatus.IN_PROGRESS, `Gemini is processing & cleaning data (${difficulty} level)...`);
      setProgressPercent(20);
      await new Promise(resolve => setTimeout(resolve, 500)); // Visual delay
      const cleaningResult = await processAndCleanData(originalData, file?.name || 'data.txt', difficulty);
      setCleanedData(cleaningResult.cleanedCsv);
      setCleaningSummary(cleaningResult.summary);
      updateStepStatus(1, ProcessStatus.COMPLETED, 'Data processing and cleaning finished.');
      setProgressPercent(100);
      await new Promise(resolve => setTimeout(resolve, 300)); // Show 100% briefly

      // Step 2: Complete
      updateStepStatus(2, ProcessStatus.COMPLETED, 'Data is ready for download or storage.');
      setIsDone(true);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`An error occurred during the cleanup process: ${errorMessage}`);
      const currentStep = processSteps.findIndex(s => s.status === ProcessStatus.IN_PROGRESS);
      if (currentStep !== -1) {
        updateStepStatus(currentStep, ProcessStatus.FAILED, 'An API error occurred.');
      }
      setProgressPercent(0);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (!cleanedData) return;
    const blob = new Blob([cleanedData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const originalFilename = file?.name.split('.').slice(0, -1).join('.') || 'data';
    link.setAttribute('download', `${originalFilename}_cleaned.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveToDrive = async () => {
    if (!cleanedData) return;

    setIsSavingToDrive(true);
    setError(null);
    setDriveFeedback({ message: "This is a demo. Simulating save to Google Drive...", type: 'info' });

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2500));
      const originalFilename = file?.name.split('.').slice(0, -1).join('.') || 'data';
      setDriveFeedback({ message: `File "${originalFilename}_cleaned.csv" was 'saved' successfully.`, type: 'success' });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to save to Google Drive: ${errorMessage}`);
      setDriveFeedback(null); // Clear info message on error
    } finally {
      setIsSavingToDrive(false);
    }
  };

  const handleSuggestAnalysis = async () => {
    if (!cleanedData) {
        setError('No cleaned data available to analyze.');
        return;
    }
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
        // Optionally remove the user message if the call failed
        setChatHistory(chatHistory);
    } finally {
        setIsChatting(false);
    }
};

  const isBusy = isLoading || isSavingToDrive || isSuggestingAnalysis || isChatting;

  return (
    <div className="min-h-screen bg-brand-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-7xl mx-auto">
        {/* FIX: Pass onHelpClick and onAboutClick props to the Header component. */}
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
            />
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
                <strong className="font-bold">Error:</strong>
                <span className="block sm:inline ml-2">{error}</span>
              </div>
            )}
             {/* FIX: Pass required progress and isLoading props to StatusTracker */}
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
      {/* FIX: Add Modal components for help and about sections. */}
      <Modal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        title="How to Use the Agent"
      >
        <div className="space-y-4 text-sm">
            <p>This agent streamlines the process of cleaning and preparing your data for analysis. Follow these steps:</p>
            <ol className="list-decimal list-inside space-y-3 pl-2">
                <li>
                    <strong className="text-brand-gray-100">Provide Your Data:</strong> Use one of the three methods to load your data. You can upload a file (like CSV, JSON, TXT), paste raw text directly, or import from the Google Drive demo.
                </li>
                <li>
                    <strong className="text-brand-gray-100">Set Cleaning Difficulty:</strong> Choose a level of cleaning intensity. 'Easy' performs basic tasks, while 'Hard' includes advanced steps like outlier and duplicate detection.
                </li>
                <li>
                    <strong className="text-brand-gray-100">Start Cleanup:</strong> Click the 'Start Cleanup' button. The agent will show its progress in the 'Agent Status' panel.
                </li>
                <li>
                    <strong className="text-brand-gray-100">Review Results:</strong> Once complete, the right-hand panel will display a summary of the cleaning actions, file details, and options to download or 'save' the cleaned file.
                </li>
                <li>
                    <strong className="text-brand-gray-100">Analyze & Chat:</strong> After cleaning, you can ask the agent to suggest analyses or chat with it directly to perform further data manipulations and analysis, like "summarize the price column" or "remove rows where stock is 0".
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
                Whether you're a data scientist, analyst, or researcher, this agent aims to accelerate your workflow by handling common data quality issues with just a few clicks.
            </p>
            <div className="pt-4 text-xs text-brand-gray-400">
                <p>Version: 1.1.0</p>
                <p>Powered by: Google Gemini API</p>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;