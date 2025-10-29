import React, { useState, useCallback } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { ImagePanel } from './components/ImagePanel';
import { ChalkboardPanel } from './components/ChalkboardPanel';
import { MobileHeader } from './components/MobileHeader';
import { PlanModal } from './components/PlanModal';
import { ScenarioModal } from './components/ScenarioModal';
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
  
  // New state for modals
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState<boolean>(false);

  const handleSendMessage = useCallback(async (userInput: string) => {
    if (!userInput.trim()) return;

    const userMessage: Message = { role: 'user', text: userInput };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    setError(null);
    setIsPlanModalOpen(false); // Close plan modal on new message

    try {
      const chatHistory = newMessages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));
      
      const latestUserMessage = chatHistory.pop();
      const prompt = latestUserMessage?.parts[0].text ?? '';

      const { responseText, imageKey, story, coverageUpdate } = await getInsuranceBotResponse(prompt, chatHistory);
      
      const hasScenario = responseText.includes('[VIEW_SCENARIO]');
      const cleanedText = responseText.replace('[VIEW_SCENARIO]', '').trim();

      const modelMessage: Message = {
        role: 'model',
        text: cleanedText,
        hasScenario: hasScenario,
        imageKeyForScenario: hasScenario ? imageKey : undefined,
      };

      setMessages(prev => [...prev, modelMessage]);
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

  const handleTogglePlanModal = () => setIsPlanModalOpen(prev => !prev);
  const handleOpenScenarioModal = (key: string) => {
    setCurrentImageKey(key);
    setIsScenarioModalOpen(true);
  };
  const handleCloseModals = () => {
    setIsPlanModalOpen(false);
    setIsScenarioModalOpen(false);
  };

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
      
      {/* --- MOBILE LAYOUT --- */}
      <div className="md:hidden flex flex-col h-full w-full">
        <MobileHeader onTogglePlan={handleTogglePlanModal} completedSteps={completedSteps} />
        <main className="flex-1 pt-16 h-full">
            <ChatPanel 
              messages={messages} 
              isLoading={isLoading} 
              error={error} 
              onSendMessage={handleSendMessage}
              onViewScenario={handleOpenScenarioModal}
            />
        </main>
        <PlanModal
            isOpen={isPlanModalOpen}
            onClose={handleCloseModals}
            details={coverageDetails}
            progress={progressPercent}
            currentTopic={currentImageKey}
        />
        <ScenarioModal 
            isOpen={isScenarioModalOpen}
            onClose={handleCloseModals}
            imageKey={currentImageKey}
            story={currentStory}
        />
      </div>

      {/* --- TABLET LAYOUT --- */}
      <main className="hidden md:flex lg:hidden flex-row flex-1 w-full h-full p-2.5 gap-2.5">
          <div className="w-1/3 h-full rounded-[15px] overflow-hidden bg-slate-800">
             <ChalkboardPanel 
              details={coverageDetails} 
              progress={progressPercent}
              currentTopic={currentImageKey}
            />
          </div>
          <div className="w-2/3 h-full flex-col rounded-[15px] overflow-hidden flex">
            <ChatPanel 
                messages={messages} 
                isLoading={isLoading} 
                error={error} 
                onSendMessage={handleSendMessage}
                onViewScenario={handleOpenScenarioModal}
            />
          </div>
          <ScenarioModal 
            isOpen={isScenarioModalOpen}
            onClose={handleCloseModals}
            imageKey={currentImageKey}
            story={currentStory}
          />
      </main>
      
      {/* --- DESKTOP LAYOUT --- */}
      <main className="hidden lg:flex flex-row flex-1 w-full h-full p-2.5 gap-2.5">
        <div className="w-1/3 h-full flex-shrink-0 flex-col gap-2.5 flex">
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
        <div className="w-2/3 h-full flex-col rounded-[15px] overflow-hidden flex">
          <ChatPanel 
            messages={messages} 
            isLoading={isLoading} 
            error={error} 
            onSendMessage={handleSendMessage} 
          />
        </div>
      </main>

    </div>
  );
};

export default App;
