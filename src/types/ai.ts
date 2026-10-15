export interface AiAutoFillResponse {
  commonName: string;
  scientificName: string;
  wateringIntervalDays: number;
  wateringIntervalDaysSummer?: number;
  wateringIntervalDaysWinter?: number;
  fertilizingIntervalDays: number;
  fertilizerType: string;
  lightRequirement: string;
  humidityRequirement: string;
  soilType: string;
  toxicity: string;
  careTips: string;
}

export interface AiDiagnosisResponse {
  healthScore: number; // 0 to 100
  status: 'عالی' | 'خوب' | 'نیازمند رسیدگی' | 'بحرانی';
  diagnosisSummary: string;
  possibleIssues: string[];
  treatmentSteps: string[];
  suggestedScheduleChanges?: {
    wateringIntervalDays?: number;
    fertilizingIntervalDays?: number;
    reason: string;
  };
  fertilizerRecommendation?: string;
  environmentalHints?: string;
}

export interface AiSettings {
  apiKey: string;
  provider: 'gemini' | 'openai';
  selectedModel: string;
}
