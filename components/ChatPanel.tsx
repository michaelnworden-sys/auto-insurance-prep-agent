import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
  onViewScenario?: (imageKey: string) => void;
}

const AgentAvatar: React.FC = () => (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center ring-2 ring-slate-800">
        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
    </div>
);


export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, isLoading, error, onSendMessage, onViewScenario }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-800">
       <style>{`
        @keyframes fade-in-message {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-message { animation: fade-in-message 0.3s ease-out forwards; }
      `}</style>
      <header className="hidden lg:block p-4 border-b border-slate-700 flex-shrink-0">
         <h1 className="text-xl font-light text-cyan-400 text-center">Auto Insurance Prep Agent</h1>
      </header>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 animate-fade-in-message ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && <AgentAvatar />}
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-slate-700 text-gray-200 rounded-bl-none'}`}>
              <p className="whitespace-pre-wrap font-normal text-sm leading-relaxed">{msg.text}</p>
              {msg.hasScenario && onViewScenario && msg.imageKeyForScenario && (
                  <button 
                    onClick={() => onViewScenario(msg.imageKeyForScenario!)}
                    className="mt-3 w-full text-left p-2 bg-slate-600/50 hover:bg-slate-600 rounded-lg transition-colors text-cyan-300 text-sm font-semibold flex items-center gap-2"
                  >
                    📖 View Scenario
                  </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-end gap-2">
             <AgentAvatar />
             <div className="bg-slate-700 text-gray-200 rounded-2xl rounded-bl-none px-4 py-2">
                <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-75"></span>
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-150"></span>
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-300"></span>
                </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="p-4 m-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <div className="p-4 border-t border-slate-700 flex-shrink-0 bg-slate-800">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about auto insurance..."
            className="flex-1 p-3 bg-slate-700 border border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-200 placeholder-gray-400 transition-shadow"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-cyan-600 text-white p-3 rounded-full hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800 transform hover:scale-105"
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};
