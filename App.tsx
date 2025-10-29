import React, { useState, useCallback } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { ImagePanel } from './components/ImagePanel';
import { ChalkboardPanel } from './components/ChalkboardPanel';
import { MobileSummaryDropdown } from './components/MobileSummaryDropdown';
import { getInsuranceBotResponse } from './services/geminiService';
import { Message, CoverageDetails } from './types';
import { INITIAL_MESSAGE, INITIAL_STORY, PROGRESS_STEPS } from './constants';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [currentImageKey, setCurrentImageKey] = useState<string>('welcome');
  const [currentStory, setCurrentStory] = useState<string[] | null>(INITIAL_STORY);
  const [coverageDetails, setCoverageDetails] = useState<CoverageDetails>({
    vehicle: {},
    coverages: {},
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState<boolean>(false);

  const handleSendMessage = useCallback(async (userInput: string) => {
    if (!userInput.trim()) return;

    const userMessage: Message = { role: 'user', text: userInput };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    setError(null);
    setIsMobileSummaryOpen(false); // Close dropdown on new message

    try {
      const chatHistory = newMessages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));
      
      const latestUserMessage = chatHistory.pop();
      const prompt = latestUserMessage?.parts[0].text ?? '';

      const { responseText, imageKey, story, coverageUpdate } = await getInsuranceBotResponse(prompt, chatHistory);
      
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
      setCurrentImageKey(imageKey);
      if (story) {
        setCurrentStory(story);
      }

      if (coverageUpdate) {
        setCoverageDetails(prev => ({
          vehicle: { ...prev.vehicle, ...coverageUpdate.vehicle },
          coverages: { ...prev.coverages, ...coverageUpdate.coverages },
        }));
      }

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Sorry, I ran into a problem. Please try again. Error: ${errorMessage}`);
      setMessages(prev => [...prev, { role: 'model', text: 'I seem to be having trouble connecting. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const completedSteps = PROGRESS_STEPS.filter(step => {
    if (step === 'vehicle') {
      const { year, makeModel, state } = coverageDetails.vehicle;
      return year && makeModel && state;
    }
    return !!coverageDetails.coverages[step];
  }).length;
  const progressPercent = (completedSteps / PROGRESS_STEPS.length) * 100;

  return (
    <div className="flex flex-col h-screen font-sans bg-slate-900 text-gray-200 overflow-hidden">
      <header className="md:hidden p-4 bg-slate-800 border-b border-slate-700 shadow-lg fixed top-0 left-0 right-0 z-20">
        <h1 className="text-xl font-bold text-cyan-400 text-center">Auto Insurance Prep Agent</h1>
      </header>

      {/* Main content area */}
      <main className="flex flex-col md:flex-row flex-1 w-full h-full md:p-2.5 pt-16 md:pt-0 gap-2.5">
        
        {/* --- DESKTOP LAYOUT --- */}
        <div className="hidden md:flex md:w-1/2 lg:w-3/5 h-full flex-shrink-0 flex-col gap-2.5">
          <div className="h-1/3 rounded-[15px] overflow-hidden bg-slate-800">
            <ChalkboardPanel 
              details={coverageDetails} 
              progress={progressPercent}
              currentTopic={currentImageKey}
            />
          </div>
          <div className="h-2/3 rounded-[15px] overflow-hidden">
            <ImagePanel imageKey={currentImageKey} story={currentStory} />
          </div>
        </div>
        <div className="hidden md:flex md:w-1/2 lg:w-2/5 h-full flex-col rounded-[15px] overflow-hidden">
          <ChatPanel 
            messages={messages} 
            isLoading={isLoading} 
            error={error} 
            onSendMessage={handleSendMessage} 
          />
        </div>

        {/* --- MOBILE LAYOUT --- */}
        <div className="flex md:hidden flex-col h-full w-full">
          <MobileSummaryDropdown 
            isOpen={isMobileSummaryOpen}
            onToggle={() => setIsMobileSummaryOpen(prev => !prev)}
            details={coverageDetails}
            currentTopic={currentImageKey}
          />
          <div className="h-[35vh] max-h-64 p-2.5 pb-0">
             <div className="h-full w-full rounded-[15px] overflow-hidden">
                <ImagePanel imageKey={currentImageKey} story={currentStory} />
             </div>
          </div>
          <div className="flex-1 flex flex-col p-2.5 pt-0">
            <div className="flex-1 rounded-[15px] overflow-hidden">
              <ChatPanel 
                messages={messages} 
                isLoading={isLoading} 
                error={error} 
                onSendMessage={handleSendMessage} 
              />
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;
