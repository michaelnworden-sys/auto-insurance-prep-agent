import React from 'react';
import { CoverageDetails } from '../types';

interface ChalkboardPanelProps {
  details: CoverageDetails;
  progress: number;
  currentTopic: string;
}

const VEHICLE_LABELS: { [key in keyof CoverageDetails['vehicle']]: string } = {
    makeModel: 'Make & Model',
    year: 'Year',
    miles: 'Mileage',
    condition: 'Condition',
    state: 'State/Location',
};

const COVERAGE_LABELS: { [key in keyof CoverageDetails['coverages']]: string } = {
    liability: 'Liability',
    collision: 'Collision',
    comprehensive: 'Comprehensive',
    pip: 'PIP / MedPay',
    underinsured: 'Uninsured/Underinsured',
};

const VEHICLE_KEYS = ['state', 'year', 'makeModel', 'miles', 'condition'];
const COVERAGE_KEYS = ['liability', 'collision', 'comprehensive', 'pip', 'underinsured'];
const PROGRESS_STEPS = ['vehicle', ...COVERAGE_KEYS];


const StatusIndicator = ({ status }: { status: 'completed' | 'in-progress' | 'pending' }) => {
  if (status === 'completed') {
    return (
      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (status === 'in-progress') {
    return <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>;
  }
  return <div className="w-3 h-3 bg-slate-600 rounded-full"></div>;
};


export const ChalkboardPanel: React.FC<ChalkboardPanelProps> = ({ details, progress, currentTopic }) => {
  const { vehicle, coverages } = details;

  const getCoverageStatus = (key: string): 'completed' | 'in-progress' | 'pending' => {
    if (coverages[key]) return 'completed';
    if (currentTopic === key) return 'in-progress';
    return 'pending';
  };
  
  const isVehicleComplete = vehicle.year && vehicle.makeModel && vehicle.state;
  const vehicleStatus = isVehicleComplete ? 'completed' : (currentTopic === 'vehicle_selection' ? 'in-progress' : 'pending');

  const hasAnyDetails = Object.keys(vehicle).length > 0 || Object.keys(coverages).length > 0;

  return (
    <div className="w-full h-full bg-slate-800 p-4 flex flex-col">
      <div className="flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-thin text-cyan-400">
                Your Insurance Plan
            </h2>
             <button 
                onClick={() => alert('Your progress has been saved! (This is a demo feature).')}
                className="text-xs text-slate-400 hover:text-cyan-400 border border-slate-600 hover:border-cyan-500 rounded-full px-3 py-1 transition-colors duration-200"
                aria-label="Save progress"
            >
                Save Progress
            </button>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4 relative">
            <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
            <div className="absolute w-full h-full top-0 flex justify-between items-center px-1">
                {PROGRESS_STEPS.map((_, index) => (
                    <div key={index} className="w-1 h-1 bg-slate-600 rounded-full"></div>
                ))}
            </div>
             {progress >= 100 && <span className="absolute right-0 -bottom-5 text-xs font-bold text-cyan-400">END</span>}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {!hasAnyDetails ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-slate-500 text-center px-4">Your selected details will appear here as we build your plan.</p>
          </div>
        ) : (
          <>
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                   <StatusIndicator status={vehicleStatus} />
                   Vehicle Info
                </h3>
                <ul className="space-y-1.5 pl-5">
                  {VEHICLE_KEYS.map(key => vehicle[key] && (
                    <li key={key} className="flex justify-between items-baseline animate-fade-in text-sm">
                      <span className="text-gray-400">{VEHICLE_LABELS[key] || key}:</span>
                      <span className="text-gray-100 font-medium text-right">{vehicle[key]}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4">Coverage Decisions</h3>
                <ul className="space-y-1.5">
                  {COVERAGE_KEYS.map((key) => (
                    <li key={key} className="flex justify-between items-center animate-fade-in text-sm">
                        <div className="flex items-center gap-2">
                            <StatusIndicator status={getCoverageStatus(key)} />
                            <span className="text-gray-400">{COVERAGE_LABELS[key] || key}:</span>
                        </div>
                      <span className="text-gray-100 font-medium text-right">{coverages[key] || '...'}</span>
                    </li>
                  ))}
                </ul>
              </div>
          </>
        )}
      </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};
