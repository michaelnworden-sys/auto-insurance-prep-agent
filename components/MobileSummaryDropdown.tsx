import React, { useRef, useEffect } from 'react';
import { CoverageDetails } from '../types';

interface MobileSummaryDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  details: CoverageDetails;
  currentTopic: string;
}

const SECTION_LABELS: { [key: string]: string } = {
    vehicle: 'Vehicle Info',
    liability: 'Liability',
    collision: 'Collision',
    comprehensive: 'Comprehensive',
    pip: 'PIP / MedPay',
    underinsured: 'Uninsured/Underinsured',
};

const PROGRESS_STEPS_ORDER = ['vehicle', 'liability', 'collision', 'comprehensive', 'pip', 'underinsured'];


const getStatus = (key: string, details: CoverageDetails, currentTopic: string): 'completed' | 'in-progress' | 'pending' => {
  if (key === 'vehicle') {
    const { year, makeModel, state } = details.vehicle;
    if (year && makeModel && state) return 'completed';
    if (currentTopic === 'vehicle_selection') return 'in-progress';
    return 'pending';
  }
  if (details.coverages[key]) return 'completed';
  if (currentTopic === key) return 'in-progress';
  return 'pending';
};

const MobileStatusIndicator = ({ status }: { status: 'completed' | 'in-progress' | 'pending' }) => {
  if (status === 'completed') return <span className="text-lg" role="img" aria-label="Completed">✅</span>;
  if (status === 'in-progress') return <span className="text-lg animate-pulse" role="img" aria-label="In Progress">⏳</span>;
  return <span className="text-lg text-slate-500" role="img" aria-label="Pending">⚪</span>;
};

export const MobileSummaryDropdown: React.FC<MobileSummaryDropdownProps> = ({ isOpen, onToggle, details, currentTopic }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  return (
    <div ref={dropdownRef} className="bg-slate-800 z-10 p-2.5 pt-0">
      <div className="rounded-[15px] overflow-hidden border border-slate-700">
         <button onClick={onToggle} className="w-full flex justify-between items-center p-3 bg-slate-800 hover:bg-slate-700/50 transition-colors" aria-expanded={isOpen}>
            <span className="font-bold text-cyan-400">Your Plan Summary</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-cyan-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
         </button>
        
        <div className={`transition-all duration-300 ease-in-out overflow-hidden bg-slate-900/50 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
            <div className="p-4 space-y-3 border-t border-slate-700">
                {PROGRESS_STEPS_ORDER.map(key => {
                    const status = getStatus(key, details, currentTopic);
                    const label = SECTION_LABELS[key] || key;
                    
                    let detailText: string | undefined;
                    if (status === 'completed') {
                        if (key === 'vehicle') {
                           detailText = `${details.vehicle.year} ${details.vehicle.makeModel}`;
                        } else {
                           detailText = details.coverages[key];
                        }
                    }

                    return (
                        <div key={key} className="flex items-start gap-3">
                            <MobileStatusIndicator status={status} />
                            <div className="flex-1">
                                <p className="font-semibold text-gray-300">{label}</p>
                                {detailText && (
                                    <p className="text-sm font-bold text-white">{detailText}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};
