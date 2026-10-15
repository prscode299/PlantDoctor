export type CareActionType = 'watering' | 'fertilizing' | 'misting' | 'repotting' | 'pruning';

export type LightLevel = 'low' | 'medium' | 'bright_indirect' | 'direct';

export interface CareLog {
  id: string;
  plantId: string;
  type: CareActionType;
  date: string; // ISO string YYYY-MM-DDTHH:mm:ss
  note?: string;
}

export interface Plant {
  id: string;
  name: string; // Persian common name or custom nickname (e.g., "پوتوس ابلق")
  scientificName: string; // e.g. "Epipremnum aureum"
  imageUri?: string; // Local storage file URI
  room?: string; // e.g., "پذیرایی", "اتاق خواب", "بالکن"
  
  // Watering schedule
  wateringIntervalDays: number;
  lastWateredDate: string; // YYYY-MM-DD
  nextWateringDate: string; // YYYY-MM-DD

  // Fertilizing schedule
  fertilizingIntervalDays: number;
  lastFertilizedDate: string; // YYYY-MM-DD
  nextFertilizingDate: string; // YYYY-MM-DD
  fertilizerType?: string; // e.g. "NPK 20-20-20", "کود آهن", "هیومیک اسید"

  // Environmental requirements
  lightRequirement?: LightLevel | string;
  humidityRequirement?: string;
  soilType?: string;
  potSize?: string;
  toxicity?: string;
  careTips?: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface PlantPreset {
  name: string;
  scientificName: string;
  defaultWateringSummer: number;
  defaultWateringWinter: number;
  defaultFertilizing: number;
  fertilizerType: string;
  lightRequirement: string;
  humidityRequirement: string;
  soilType: string;
  careTips: string;
  toxicity: string;
  iconName?: string;
}
