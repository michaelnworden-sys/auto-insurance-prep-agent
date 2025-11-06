import React, { useState, useCallback } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { ImagePanel } from './components/ImagePanel';
import { ChalkboardPanel } from './components/ChalkboardPanel';
import { MobileHeader } from './components/MobileHeader';
import { PlanModal } from './components/PlanModal';
import { ScenarioModal } from './components/ScenarioModal';
import { getInsuranceBotResponse } from './services/geminiService';
import { Message, CoverageDetails } from './types';
import { INITIAL_MESSAGE, INITIAL_STORY, PROGRESS_STEPS, IMAGE_MAP } from './constants';

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
  const [conversationPhase, setConversationPhase] = useState<'info_collection' | 'coverage_discussion'>('info_collection');
  
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState<boolean>(false);

  // --- NEW: State and handler for the tablet dropdown ---
  const [isChalkboardOpen, setIsChalkboardOpen] = useState<boolean>(false);
  const handleToggleChalkboard = () => setIsChalkboardOpen(prev => !prev);


  const handleSendMessage = useCallback(async (userInput: string) => {
    if (!userInput.trim()) return;

    const userMessage: Message = { role: 'user', text: userInput };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    setError(null);
    setIsPlanModalOpen(false); 

    try {
      const chatHistory = newMessages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));
      
      const latestUserMessage = chatHistory.pop();
      const prompt = latestUserMessage?.parts[0].text ?? '';

      const { responseText, imageKey, coverageUpdate } = await getInsuranceBotResponse(prompt, chatHistory, conversationPhase);
      
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

      const storyFromMap = IMAGE_MAP[imageKey]?.story || null;
      setCurrentStory(storyFromMap);

      if (coverageUpdate) {
        setCoverageDetails(prev => ({
          vehicle: { ...prev.vehicle, ...coverageUpdate.vehicle },
          coverages: { ...prev.coverages, ...coverageUpdate.coverages },
        }));

        if (coverageUpdate.vehicle) {
          const updatedVehicle = { ...coverageDetails.vehicle, ...coverageUpdate.vehicle };
          const isVehicleComplete = updatedVehicle.state && updatedVehicle.year && updatedVehicle.makeModel && updatedVehicle.miles;
          
          if (isVehicleComplete && conversationPhase === 'info_collection') {
            setConversationPhase('coverage_discussion');
          }
        }
      }

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Sorry, I ran into a problem. Please try again. Error: ${errorMessage}`);
      setMessages(prev => [...prev, { role: 'model', text: 'I seem to be having trouble connecting. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, conversationPhase, coverageDetails.vehicle]);

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
      
      {/* --- MOBILE LAYOUT (No Changes) --- */}
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

      {/* --- NEW TABLET LAYOUT --- */}
      <main className="hidden md:flex lg:hidden flex-col flex-1 w-full h-full p-2.5 gap-2.5">
          {/* Collapsible Chalkboard Header */}
          <div className="flex-shrink-0">
              <div 
                className="bg-slate-800 rounded-[15px] p-4 flex justify-between items-center cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={handleToggleChalkboard}
              >
                <h2 className="font-bold text-lg text-white">Your Auto Insurance Plan</h2>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-cyan-400 transition-transform duration-300 ${isChalkboardOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Conditionally Rendered Chalkboard Panel */}
              {isChalkboardOpen && (
                  <div className="mt-2.5 rounded-[15px] overflow-hidden bg-slate-800 animate-fade-in">
                      <ChalkboardPanel 
                          details={coverageDetails} 
                          progress={progressPercent}
                          currentTopic={currentImageKey}
                      />
                  </div>
              )}
          </div>
          
          {/* 50/50 Split for Image and Chat */}
          <div className="flex-1 flex flex-row gap-2.5 overflow-hidden">
              <div className="w-1/2 h-full rounded-[15px] overflow-hidden">
                  <ImagePanel imageKey={currentImageKey} story={currentStory} />
              </div>
              <div className="w-1/2 h-full rounded-[15px] overflow-hidden">
                  <ChatPanel 
                      messages={messages} 
                      isLoading={isLoading} 
                      error={error} 
                      onSendMessage={handleSendMessage}
                  />
              </div>
          </div>
      </main>
      
      {/* --- DESKTOP LAYOUT (No Changes) --- */}
      <main className="hidden lg:flex flex-row flex-1 w-full h-full p-2.5 gap-2.5">
        <div className="w-1/2 h-full flex-shrink-0 flex-col gap-2.5 flex">
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
        <div className="w-1/2 h-full flex-col rounded-[15px] overflow-hidden flex">
          <ChatPanel 
            messages={messages} 
            isLoading={isLoading} 
            error={error} 
            onSendMessage={handleSendMessage} 
          />
        </div>
      </main>

      {/* Basic animation for the dropdown content */}
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;