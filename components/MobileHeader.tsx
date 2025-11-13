// components/MobileHeader.tsx

import React from 'react';

// NEW: The component now needs to know if sound is on and how to toggle it.
interface MobileHeaderProps {
  onTogglePlan: () => void;
  completedSteps: number;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
}

// NEW: Your sleek "Sound On" icon, converted to a reusable component.
const SpeakerOnIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
  </svg>
);

// NEW: Your sleek "Sound Off" icon.
const SpeakerOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
  </svg>
);

// NEW: The component now receives the new props.
export const MobileHeader: React.FC<MobileHeaderProps> = ({ onTogglePlan, completedSteps, isSoundEnabled, onToggleSound }) => {
  return (
    <header className="md:hidden p-4 bg-slate-800 border-b border-slate-700 shadow-lg flex justify-between items-center fixed top-0 left-0 right-0 z-20">
      <h1 className="text-xl font-bold text-cyan-400">
        Prep Agent
      </h1>
      
      {/* NEW: We group the buttons together for better layout. */}
      <div className="flex items-center gap-2">
        {/* NEW: This is the sound toggle button itself. */}
        <button
          onClick={onToggleSound}
          className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
          aria-label={isSoundEnabled ? 'Disable sound' : 'Enable sound'}
        >
          {isSoundEnabled ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
        </button>

        <button
          onClick={onTogglePlan}
          className="text-sm font-semibold bg-cyan-600 text-white rounded-full px-4 py-2 hover:bg-cyan-500 transition-colors"
          aria-label={`View your plan, ${completedSteps} steps completed`}
        >
          My Plan ({completedSteps})
        </button>
      </div>
    </header>
  );
};
