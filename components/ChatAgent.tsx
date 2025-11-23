
import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { SendIcon } from './icons/SendIcon';
import { ChatAgentIcon } from './icons/ChatAgentIcon';
import { LogoIcon } from './icons/LogoIcon';
import { AnalysisResultView } from './AnalysisResultView';

interface ChatAgentProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

// Helper component to safely render emphasized text without dangerouslySetInnerHTML.
// It parses strings like _"text"_ and converts them to <em>"text"</em>.
const FormattedMessage: React.FC<{ content: string }> = ({ content }) => {
    // Split the string by the custom emphasis pattern, keeping the delimiters.
    // e.g., "Hello _\"world\"_" -> ["Hello ", "_\"world\"_", ""]
    const parts = content.split(/(_".*?"_)/g);
  
    return (
        <React.Fragment>
            {parts.map((part, i) => {
                // If a part matches the emphasis pattern...
                if (part.startsWith('_"') && part.endsWith('"_')) {
                    // ...extract the inner text...
                    const innerText = part.slice(2, -2);
                    // ...and render it inside an <em> tag.
                    return <em key={i}>&quot;{innerText}&quot;</em>;
                }
                // Otherwise, render the part as plain text.
                return part;
            })}
        </React.Fragment>
    );
};

export const ChatAgent: React.FC<ChatAgentProps> = ({ messages, onSendMessage, isLoading }) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMessage.trim() && !isLoading) {
      onSendMessage(currentMessage);
      setCurrentMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="bg-brand-gray-800/50 p-6 rounded-xl shadow-lg flex flex-col h-[500px]">
      <h2 className="text-xl font-semibold text-brand-gray-100 mb-4 flex items-center">
        <ChatAgentIcon className="w-6 h-6 mr-3 text-brand-gray-300" />
        5. Chat with Agent
      </h2>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-brand-blue-light/50 flex items-center justify-center flex-shrink-0">
                <LogoIcon className="w-5 h-5 text-white" />
              </div>
            )}
            <div
              className={`max-w-md p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-brand-blue-light text-white rounded-br-none'
                  : 'bg-brand-gray-700 text-brand-gray-200 rounded-bl-none'
              }`}
            >
              {/* Replaced dangerouslySetInnerHTML with a safe component-based approach to prevent XSS vulnerabilities. */}
              <p className="text-sm whitespace-pre-wrap">
                <FormattedMessage content={msg.content} />
              </p>
              {msg.analysisResult && (
                  <div className="mt-3 pt-3 border-t border-brand-gray-600/50">
                     <AnalysisResultView result={msg.analysisResult}/>
                  </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex items-start gap-3">
                 <div className="w-8 h-8 rounded-full bg-brand-blue-light/50 flex items-center justify-center flex-shrink-0">
                    <LogoIcon className="w-5 h-5 text-white animate-pulse-fast" />
                </div>
                <div className="max-w-md p-3 rounded-lg bg-brand-gray-700 text-brand-gray-200 rounded-bl-none">
                    <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 bg-brand-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-brand-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-brand-gray-400 rounded-full animate-pulse"></span>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="relative">
        <textarea
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Remove the 'price' column..."
          disabled={isLoading}
          rows={2}
          className="w-full p-3 pr-12 bg-brand-gray-900 border border-brand-gray-700 rounded-md resize-none focus:ring-2 focus:ring-brand-blue focus:outline-none text-sm text-brand-gray-300 disabled:opacity-50"
          aria-label="Chat with data agent"
        />
        <button
          type="submit"
          disabled={isLoading || !currentMessage.trim()}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full text-white bg-brand-blue-light hover:bg-brand-blue disabled:bg-brand-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue focus:ring-offset-brand-gray-800 transition-colors"
          aria-label="Send message"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
