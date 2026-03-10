import { useState, useEffect, useRef, useCallback } from 'react';
import { PlantData, PlantState, SignalDataPoint, Stimulus, CorrelationLog } from '../types';
import { PLANT_CONFIGS, SPECIES_TRAITS } from '../data/plants';

export function usePlantSystem() {
  // Initialize state for 20 plants
  const [plants, setPlants] = useState<PlantData[]>(() => 
    PLANT_CONFIGS.map(config => ({
      state: {
        id: config.id,
        name: config.name,
        species: config.species,
        stressLevel: 20 + Math.random() * 30,
        hydration: 50 + Math.random() * 50,
        lightLevel: 40 + Math.random() * 60,
        lastStimulus: null,
        timestamp: Date.now(),
      },
      history: []
    }))
  );

  const [logs, setLogs] = useState<CorrelationLog[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  // Refs for simulation loop to avoid stale closures
  const plantsRef = useRef<PlantData[]>(plants);
  const timeRef = useRef(0);
  const activeStimuliRef = useRef<{ stimulus: Stimulus; remaining: number }[]>([]);

  // Keep ref in sync with state for initialization, but mostly we drive from ref -> state
  useEffect(() => {
    plantsRef.current = plants;
  }, []); // Run once on mount to sync, then the loop takes over

  const applyStimulus = useCallback((stimulus: Stimulus) => {
    activeStimuliRef.current.push({ stimulus, remaining: stimulus.duration });
    
    // Immediate state updates
    plantsRef.current = plantsRef.current.map(plant => {
      // Check if this stimulus applies to this plant
      if (stimulus.targetPlantId && stimulus.targetPlantId !== plant.state.id) {
        return plant;
      }

      const newState = { ...plant.state, lastStimulus: stimulus.type };
      if (stimulus.type === 'Water') {
        newState.hydration = Math.min(100, newState.hydration + 20);
      }
      return { ...plant, state: newState };
    });
    
    setPlants([...plantsRef.current]);
  }, []);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      timeRef.current += 0.1;

      // 1. Process Physics & Signals
      const updatedPlants = plantsRef.current.map(plant => {
        const traits = SPECIES_TRAITS[plant.state.species] || SPECIES_TRAITS['Fern'];
        
        let currentFreq = traits.baseFreq;
        let currentAmp = traits.amp;
        let currentNoise = traits.noise;

        // Apply State Modifiers
        currentFreq += (plant.state.stressLevel / 100) * 0.5;
        currentNoise += (plant.state.stressLevel / 100) * 2;
        currentAmp *= (plant.state.hydration / 100);

        // Apply Stimuli
        let activeCondition = 'Random';
        
        activeStimuliRef.current.forEach(({ stimulus }) => {
          if (stimulus.targetPlantId && stimulus.targetPlantId !== plant.state.id) return;
          
          activeCondition = stimulus.type;
          const intensity = stimulus.intensity / 100;
          
          switch (stimulus.type) {
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
        });

        // Generate Waveform
        // Add a unique phase offset based on plant ID hash to prevent identical waves by default
        const phaseOffset = plant.state.id.charCodeAt(1) * 13.37; 
        
        // Unique modulation per plant
        const modFreq = 0.1 + (plant.state.id.charCodeAt(0) % 5) * 0.05;
        const modulation = Math.sin(timeRef.current * modFreq) * 0.2;

        const base = Math.sin((timeRef.current + phaseOffset) * currentFreq * Math.PI * 2) * currentAmp * (1 + modulation);
        
        // Randomized harmonic structure
        const h2 = Math.sin((timeRef.current + phaseOffset) * currentFreq * 2 * Math.PI * 2) * (currentAmp * 0.15);
        const h3 = Math.sin((timeRef.current + phaseOffset) * currentFreq * 3 * Math.PI * 2) * (currentAmp * 0.1);
        
        const noiseVal = (Math.random() - 0.5) * currentNoise * (1 + Math.sin(timeRef.current * 0.5));
        
        const voltage = base + h2 + h3 + noiseVal;

        // Drift State
        const newStress = Math.max(0, Math.min(100, plant.state.stressLevel + (Math.random() - 0.5) * 0.5));
        const newHydration = Math.max(0, plant.state.hydration - 0.01);

        const newPoint: SignalDataPoint = { timestamp: now, voltage, frequency: currentFreq };
        
        // Update History
        const newHistory = [...plant.history, newPoint];
        if (newHistory.length > 50) newHistory.shift(); // Keep last 50 points for performance

        return {
          ...plant,
          state: {
            ...plant.state,
            stressLevel: newStress,
            hydration: newHydration,
            timestamp: now,
            // Clear stimulus label if expired (handled in cleanup below)
          },
          history: newHistory,
          // Store current values for correlation check
          currentValues: { voltage, frequency: currentFreq, condition: activeCondition }
        };
      });

      // 2. Correlation Analysis
      // Check for similar waveforms (Voltage & Freq proximity)
      const correlatedGroups: string[][] = [];
      const processedIds = new Set<string>();

      for (let i = 0; i < updatedPlants.length; i++) {
        const p1 = updatedPlants[i];
        if (processedIds.has(p1.state.id)) continue;

        const group = [p1.state.id];
        // @ts-ignore
        const v1 = p1.currentValues.voltage;
        // @ts-ignore
        const f1 = p1.currentValues.frequency;
        // @ts-ignore
        const c1 = p1.currentValues.condition;

        for (let j = i + 1; j < updatedPlants.length; j++) {
          const p2 = updatedPlants[j];
          if (processedIds.has(p2.state.id)) continue;

          // @ts-ignore
          const v2 = p2.currentValues.voltage;
          // @ts-ignore
          const f2 = p2.currentValues.frequency;

          // Similarity Thresholds
          const voltDiff = Math.abs(v1 - v2);
          const freqDiff = Math.abs(f1 - f2);

          // If very similar
          if (voltDiff < 2 && freqDiff < 0.05) {
            group.push(p2.state.id);
            processedIds.add(p2.state.id);
          }
        }

        if (group.length > 1) {
          processedIds.add(p1.state.id);
          // Log it
          // Only log if we haven't logged this exact group recently (simple throttle)
          if (Math.random() > 0.95) { // 5% chance to log per tick to avoid spam
             setLogs(prev => [{
               id: Math.random().toString(36).substr(2, 9),
               timestamp: now,
               plantIds: group,
               similarityScore: 90 + Math.random() * 10,
               condition: c1
             }, ...prev].slice(0, 50));
          }
        }
      }

      // 3. Cleanup Stimuli
      activeStimuliRef.current.forEach(s => s.remaining -= 50);
      activeStimuliRef.current = activeStimuliRef.current.filter(s => s.remaining > 0);
      
      // Clear stimulus label from state if no active stimuli for that plant
      updatedPlants.forEach(p => {
        const hasActive = activeStimuliRef.current.some(s => 
          !s.stimulus.targetPlantId || s.stimulus.targetPlantId === p.state.id
        );
        if (!hasActive) p.state.lastStimulus = null;
      });

      plantsRef.current = updatedPlants;
      setPlants(updatedPlants);

    }, 50);

    return () => clearInterval(interval);
  }, [isPaused]);

  return {
    plants,
    logs,
    applyStimulus,
    isPaused,
    setIsPaused
  };
}
