import React from 'react';

interface MobileHeaderProps {
  onTogglePlan: () => void;
  completedSteps: number;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onTogglePlan, completedSteps }) => {
  return (
    <header className="md:hidden p-4 bg-slate-800 border-b border-slate-700 shadow-lg flex justify-between items-center fixed top-0 left-0 right-0 z-20">
      <h1 className="text-xl font-bold text-cyan-400">
        Prep Agent
      </h1>
      <button
        onClick={onTogglePlan}
        className="text-sm font-semibold bg-cyan-600 text-white rounded-full px-4 py-2 hover:bg-cyan-500 transition-colors"
        aria-label={`View your plan, ${completedSteps} steps completed`}
      >
        My Plan ({completedSteps})
      </button>
    </header>
  );
};
