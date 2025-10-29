// Fix: Define and export all application-specific types.
export interface Message {
  role: 'user' | 'model';
  text: string;
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

export interface GeminiResponse {
  responseText: string;
  imageKey: string;
  story: string[];
  coverageUpdate?: {
    vehicle?: VehicleDetails;
    coverages?: Coverages;
  };
}

export interface HistoryItem {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}
