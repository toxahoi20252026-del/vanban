
export interface AnalysisResult {
  text: string;
  timestamp: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface HistoryItem {
  id: string;
  fileName: string;
  timestamp: number;
  rawOutput: string;
  activePreset: string;
}

export interface InitiativeApplication {
  // Author Info
  authorName: string;
  authorDOB: string;
  authorWorkplace: string;
  authorTitle: string;
  authorLevel: string;
  authorContribution: string;
  
  // Initiative Info
  initiativeName: string;
  applicationField: string;
  firstAppliedDate: string;
  investor: string;
  
  // Content
  currentState: string;
  purpose: string;
  solution1: string;
  solution2: string;
  solution3: string;
  applicability: string;
  benefits: string;
  conditions: string;
  confidentialInfo: string;
  
  // Participants
  participants: { name: string; dob: string; workplace: string; title: string; level: string; contribution: string; }[];
}

export interface LogicCheckResult {
  isConsistent: boolean;
  score: number;
  analysis: string;
  recommendations: string[];
}

export interface OriginalityReport {
  originalityScore: number;
  templateMatchPercentage: number;
  overusedPhrases: string[];
  suggestions: string;
}
