export type PlantSpecies = 'Fern' | 'Succulent' | 'Orchid' | 'Basil' | 'Ivy' | 'Bamboo' | 'Rose' | 'Mint' | 'Aloe' | 'Cactus' | 'Lily' | 'Tulip' | 'Daisy' | 'Lavender' | 'Jasmine' | 'Bonsai' | 'Palm' | 'Ficus' | 'Pothos' | 'Snake Plant';

export interface PlantState {
  id: string;
  name: string;
  species: PlantSpecies;
  stressLevel: number; // 0-100
  hydration: number; // 0-100
  lightLevel: number; // 0-100
  lastStimulus: string | null;
  timestamp: number;
}

export interface SignalDataPoint {
  timestamp: number;
  voltage: number; // microvolts
  frequency: number; // Hz (instantaneous)
}

export interface PlantData {
  state: PlantState;
  history: SignalDataPoint[];
}

export interface Stimulus {
  type: 'Water' | 'Light' | 'Touch' | 'Sound';
  intensity: number; // 0-100
  duration: number; // ms
  targetPlantId?: string; // If null, applies to all
}

export interface CorrelationLog {
  id: string;
  timestamp: number;
  plantIds: string[];
  similarityScore: number;
  condition: 'Random' | string; // 'Random' or the active stimulus type
}
