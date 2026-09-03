export enum PlasticCategory {
  LDPE = 'LDPE',
  HDPE = 'HDPE',
  PET = 'PET',
  PP = 'PP',
  PVC = 'PVC',
  MLP = 'MLP',
  OTHER = 'Other'
}

export interface MixRatio {
  plasticKg: number;
  soilKg: number;
  sandKg: number;
  cementKg: number;
}

export interface AnalysisResult {
  category: PlasticCategory;
  confidence: number;
  thicknessMicrons: number;
  brickType: string;
  mixRatio: MixRatio;
  reasoning: string;
  productionNote: string;
}

export interface HistoryItem {
  id: string;
  date: string;
  result: AnalysisResult;
  thumbnail: string; // Base64 thumbnail
}

export interface User {
  email: string;
  name: string;
}

export interface AppState {
  view: 'login' | 'dashboard' | 'analysis' | 'history';
  isAnalyzing: boolean;
  error: string | null;
  result: AnalysisResult | null;
  currentImage: string | null; // Base64
  user: User | null;
  history: HistoryItem[];
  darkMode: boolean;
}