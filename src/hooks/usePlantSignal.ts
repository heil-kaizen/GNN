import { useState, useEffect, useRef, useCallback } from 'react';
import { PlantState, SignalDataPoint, PlantSpecies, Stimulus } from '../types';

const SPECIES_CONFIG: Partial<Record<PlantSpecies, { baseFreq: number; amp: number; noise: number }>> = {
  Fern: { baseFreq: 0.5, amp: 15, noise: 2 },
  Succulent: { baseFreq: 0.1, amp: 5, noise: 0.5 },
  Orchid: { baseFreq: 0.3, amp: 10, noise: 1 },
  Basil: { baseFreq: 0.8, amp: 20, noise: 3 },
};

const DEFAULT_CONFIG = { baseFreq: 0.4, amp: 12, noise: 1.5 };

export function usePlantSignal(initialSpecies: PlantSpecies = 'Fern') {
  const [species, setSpecies] = useState<PlantSpecies>(initialSpecies);
  
  // We use refs for the simulation state to avoid re-running the effect constantly
  const stateRef = useRef<PlantState>({
    species: initialSpecies,
    stressLevel: 20,
    hydration: 80,
    lightLevel: 50,
    lastStimulus: null,
    timestamp: Date.now(),
  });

  // We expose a state version for the UI to render
  const [plantState, setPlantState] = useState<PlantState>(stateRef.current);
  const [signalHistory, setSignalHistory] = useState<SignalDataPoint[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  
  const timeRef = useRef(0);
  const stimulusRef = useRef<{ type: string; remaining: number; intensity: number } | null>(null);

  const applyStimulus = useCallback((stimulus: Stimulus) => {
    stimulusRef.current = { 
      type: stimulus.type, 
      remaining: stimulus.duration, 
      intensity: stimulus.intensity 
    };
    
    stateRef.current.lastStimulus = stimulus.type;
    
    // Immediate state effects
    if (stimulus.type === 'Water') {
      stateRef.current.hydration = Math.min(100, stateRef.current.hydration + 20);
    }
    // Trigger immediate UI update
    setPlantState({ ...stateRef.current });
  }, []);

  useEffect(() => {
    // Reset state when species changes
    stateRef.current.species = species;
    setPlantState({ ...stateRef.current });
  }, [species]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      timeRef.current += 0.1; // Time step
      
      const config = SPECIES_CONFIG[stateRef.current.species] || DEFAULT_CONFIG;
      let currentFreq = config.baseFreq;
      let currentAmp = config.amp;
      let currentNoise = config.noise;
      
      // Apply state modifiers from Ref
      currentFreq += (stateRef.current.stressLevel / 100) * 0.5;
      currentNoise += (stateRef.current.stressLevel / 100) * 2;
      currentAmp *= (stateRef.current.hydration / 100);

      // Apply active stimulus effects
      if (stimulusRef.current && stimulusRef.current.remaining > 0) {
        const intensity = stimulusRef.current.intensity / 100;
        
        switch (stimulusRef.current.type) {
          case 'Touch':
            currentFreq += 5 * intensity;
            currentAmp += 20 * intensity;
            currentNoise += 5 * intensity;
            break;
          case 'Light':
            currentAmp += 10 * intensity;
            break;
          case 'Sound':
            currentFreq += 2 * intensity;
            break;
        }
        stimulusRef.current.remaining -= 50;
      } else if (stimulusRef.current && stimulusRef.current.remaining <= 0) {
        stimulusRef.current = null;
        stateRef.current.lastStimulus = null;
      }

      // Generate waveform
      const base = Math.sin(timeRef.current * currentFreq * Math.PI * 2) * currentAmp;
      const harmonic = Math.sin(timeRef.current * currentFreq * 3 * Math.PI * 2) * (currentAmp * 0.3);
      const noiseVal = (Math.random() - 0.5) * currentNoise;
      
      const voltage = base + harmonic + noiseVal;

      const newPoint: SignalDataPoint = {
        timestamp: now,
        voltage,
        frequency: currentFreq
      };

      setSignalHistory(prev => {
        const newHistory = [...prev, newPoint];
        if (newHistory.length > 100) return newHistory.slice(-100); // Keep last 100 points
        return newHistory;
      });

      // Slowly drift stress/hydration
      stateRef.current.stressLevel = Math.max(0, Math.min(100, stateRef.current.stressLevel + (Math.random() - 0.5) * 0.5));
      stateRef.current.hydration = Math.max(0, stateRef.current.hydration - 0.01);
      stateRef.current.timestamp = now;

      // Sync ref to state for UI (throttled if needed, but 20Hz is fine for React 18)
      setPlantState({ ...stateRef.current });

    }, 50);

    return () => clearInterval(interval);
  }, [isPaused]); // Only re-run if pause state changes

  return {
    species,
    setSpecies,
    plantState,
    signalHistory,
    applyStimulus,
    isPaused,
    setIsPaused
  };
}
