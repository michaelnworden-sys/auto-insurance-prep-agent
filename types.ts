// types.ts (REVISED)

export interface Message {
  role: 'user' | 'model';
  text: string;
  hasScenario?: boolean;
  imageKeyForScenario?: string;
}

export interface VehicleDetails {
  makeModel?: string;
  year?: string;
  miles?: string;
  condition?: string;
  state?: string;
}

export interface Coverages {
  [key: string]: string | undefined;
  liability?: string;
  collision?: string;
  comprehensive?: string;
  pip?: string;
  underinsured?: string;
}

export interface CoverageDetails {
  vehicle: VehicleDetails;
  coverages: Coverages;
}

export interface MediaInfo {
  src: string;
  alt: string;
  topic: string;
  type: 'image' | 'video';
  story: string[];
}

// --- NEW TYPE DEFINITION ---
// This tells our app what the valid coverage topics are.
export type CoverageTopic = 'liability' | 'collision' | 'comprehensive' | 'pip' | 'underinsured';

// --- CORRECTED GEMINI RESPONSE TYPE ---
// The 'story' field is removed because the AI doesn't generate the story,
// the app looks it up from IMAGE_MAP using the imageKey.
export interface GeminiResponse {
  responseText: string;
  imageKey: string;
  coverageUpdate?: {
    vehicle?: VehicleDetails;
    coverages?: Coverages;
  };
}

export interface HistoryItem {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}