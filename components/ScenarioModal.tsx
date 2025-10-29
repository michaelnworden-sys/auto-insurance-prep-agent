import React from 'react';
import { ImagePanel } from './ImagePanel';

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageKey: string;
  story: string[] | null;
}

export const ScenarioModal: React.FC<ScenarioModalProps> = ({ isOpen, onClose, imageKey, story }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <style>{`
        @keyframes slide-up-modal {
          from { opacity: 0; transform: translateY(50px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-up-modal { animation: slide-up-modal 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
      <div
        className="relative w-full h-full max-w-2xl max-h-[80vh] bg-slate-900 rounded-[15px] overflow-hidden shadow-2xl animate-slide-up-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <ImagePanel imageKey={imageKey} story={story} />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white z-10 transition-colors"
          aria-label="Close scenario view"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
