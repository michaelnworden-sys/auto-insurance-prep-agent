// App.tsx (FINAL VERSION with corrected ChatPanel header)

import React, { useState, useCallback, useRef } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { ImagePanel } from './components/ImagePanel';
import { ChalkboardPanel } from './components/ChalkboardPanel';
import { MobileHeader } from './components/MobileHeader';
import { PlanModal } from './components/PlanModal';
import { ScenarioModal } from './components/ScenarioModal';
import { getInsuranceBotResponse } from './services/geminiService';
import { convertTextToSpeech } from './services/ttsService'; 
import { Message, CoverageDetails, CoverageTopic } from './types';
import { INITIAL_MESSAGE, INITIAL_STORY, PROGRESS_STEPS, IMAGE_MAP } from './constants';

const SpeakerOnIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
  </svg>
);

const SpeakerOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
  </svg>
);


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
  
  const [conversationPhase, setConversationPhase] = useState<'info_collection' | 'coverage_discussion' | 'summary'>('info_collection');
  const [currentCoverageTopic, setCurrentCoverageTopic] = useState<CoverageTopic | null>(null);

  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState<boolean>(false);
  const [isChalkboardOpen, setIsChalkboardOpen] = useState<boolean>(false);
  const handleToggleChalkboard = () => setIsChalkboardOpen(prev => !prev);

  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleToggleSound = () => {
    setIsSoundEnabled(prev => {
        const isCurrentlyEnabled = prev;
        if (isCurrentlyEnabled && audioRef.current) {
            audioRef.current.pause();
        }
        return !isCurrentlyEnabled;
    });
  };


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
      let prompt = latestUserMessage?.parts[0].text ?? '';

      const { responseText, imageKey, coverageUpdate } = await getInsuranceBotResponse(
        prompt, 
        chatHistory, 
        conversationPhase, 
        currentCoverageTopic
      );
      
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
      setCurrentStory(IMAGE_MAP[imageKey]?.story || null);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      if (isSoundEnabled && cleanedText) {
        try {
          const audio = await convertTextToSpeech(cleanedText);
          if (audio) {
              audioRef.current = audio;
              audioRef.current.play();
          }
        } catch (ttsError) {
            console.error("Text-to-speech failed:", ttsError);
        }
      }

      if (coverageUpdate) {
        setCoverageDetails(prev => ({
          vehicle: { ...prev.vehicle, ...coverageUpdate.vehicle },
          coverages: { ...prev.coverages, ...coverageUpdate.coverages },
        }));

        const updatedVehicle = { ...coverageDetails.vehicle, ...coverageUpdate.vehicle };
        const isVehicleComplete = updatedVehicle.state && updatedVehicle.year && updatedVehicle.makeModel && updatedVehicle.miles;

        if (isVehicleComplete && conversationPhase === 'info_collection') {
          setConversationPhase('coverage_discussion');
          setCurrentCoverageTopic('liability');
        }

        if (conversationPhase === 'coverage_discussion' && coverageUpdate.coverages) {
          const newlyDecided = Object.keys(coverageUpdate.coverages)[0];
          let nextTopic: CoverageTopic | null = null;
          switch (newlyDecided) {
            case 'liability':     nextTopic = 'collision'; break;
            case 'collision':     nextTopic = 'comprehensive'; break;
            case 'comprehensive': nextTopic = 'pip'; break;
            case 'pip':           nextTopic = 'underinsured'; break;
            case 'underinsured':  
              setConversationPhase('summary');
              setCurrentCoverageTopic(null);
              break;
          }
          if (nextTopic) {
            setCurrentCoverageTopic(nextTopic);
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
  }, [messages, conversationPhase, currentCoverageTopic, coverageDetails.vehicle, isSoundEnabled]);

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
        <MobileHeader 
          onTogglePlan={handleTogglePlanModal} 
          completedSteps={completedSteps} 
          isSoundEnabled={isSoundEnabled}
          onToggleSound={handleToggleSound}
        />
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
      <main className="hidden md:flex lg:hidden flex-col flex-1 w-full h-full p-2.5 gap-2.5">
          <div className="flex-shrink-0">
              <div 
                className="bg-slate-800 rounded-[15px] p-4 flex justify-between items-center cursor-pointer"
                onClick={handleToggleChalkboard}
              >
                <h2 
                  className="font-bold text-lg text-white flex-1"
                >
                  Your Auto Insurance Plan
                </h2>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-cyan-400 transition-transform duration-300`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
              </div>

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
          
          <div className="flex-1 flex flex-row gap-2.5 overflow-hidden">
              <div className="w-1/2 h-full rounded-[15px] overflow-hidden">
                  <ImagePanel imageKey={currentImageKey} story={currentStory} />
              </div>
              <div className="w-1/2 h-full rounded-[15px] overflow-hidden flex flex-col bg-slate-800">
                  {/* NEW: Correct Header for Tablet */}
                  <div className="p-4 flex justify-between items-center border-b border-slate-700 flex-shrink-0">
                    <h1 className="text-xl font-light text-cyan-400">Auto Insurance Prep Agent</h1>
                    <button
                      onClick={handleToggleSound}
                      className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      aria-label={isSoundEnabled ? 'Disable sound' : 'Enable sound'}
                    >
                      {isSoundEnabled ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto">
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
      
      {/* --- DESKTOP LAYOUT --- */}
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
        <div className="w-1/2 h-full flex flex-col rounded-[15px] overflow-hidden bg-slate-800">
            {/* NEW: Correct Header for Desktop */}
            <div className="p-4 flex justify-between items-center border-b border-slate-700 flex-shrink-0">
              <h1 className="text-xl font-light text-cyan-400">Auto Insurance Prep Agent</h1>
              <button
                onClick={handleToggleSound}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-label={isSoundEnabled ? 'Disable sound' : 'Enable sound'}
              >
                {isSoundEnabled ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <ChatPanel 
                messages={messages} 
                isLoading={isLoading} 
                error={error} 
                onSendMessage={handleSendMessage} 
              />
            </div>
        </div>
      </main>

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