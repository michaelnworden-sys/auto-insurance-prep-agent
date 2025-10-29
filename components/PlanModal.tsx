import React from 'react';
import { ChalkboardPanel } from './ChalkboardPanel';
import { CoverageDetails } from '../types';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  details: CoverageDetails;
  progress: number;
  currentTopic: string;
}

export const PlanModal: React.FC<PlanModalProps> = ({ isOpen, onClose, ...props }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-start justify-center p-4 md:hidden"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
        <style>{`
            @keyframes slide-in-top {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-slide-in-top { animation: slide-in-top 0.3s ease-out forwards; }
        `}</style>
      <div
        className="bg-slate-800 rounded-[15px] w-full max-w-lg max-h-[80vh] overflow-hidden mt-20 animate-slide-in-top shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-full">
            <div className="h-[75vh] max-h-[75vh]">
                 <ChalkboardPanel {...props} />
            </div>
            <button
                onClick={onClose}
                className="absolute top-2 right-2 p-2 bg-slate-700/50 hover:bg-slate-600 rounded-full text-white z-10"
                aria-label="Close plan summary"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
      </div>
    </div>
  );
};
