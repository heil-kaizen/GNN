import { useState, useEffect, useRef, useCallback } from 'react';
import { PlantData, SignalDataPoint, Stimulus, CorrelationLog } from '../types';
import { PLANT_CONFIGS } from '../data/plants';

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
  const [isConnected, setIsConnected] = useState(false);

  const plantsRef = useRef<PlantData[]>(plants);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    plantsRef.current = plants;
  }, [plants]);

  // Connect to the WebSocket server
  useEffect(() => {
    if (isPaused) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    // Connect to the Python FastAPI WebSocket endpoint
    const ws = new WebSocket('ws://localhost:8000/ws/plants');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to Bio-Hybrid WebSocket');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const now = Date.now();

        // Update plants with real data from the WebSocket
        const updatedPlants = plantsRef.current.map((plant, index) => {
          // The backend sends an array of voltages corresponding to each plant index
          const voltage = data.signals[index] || 0;
          const frequency = data.frequencies ? data.frequencies[index] : 0;
          
          const newPoint: SignalDataPoint = { timestamp: now, voltage, frequency };
          
          const newHistory = [...plant.history, newPoint];
          if (newHistory.length > 50) newHistory.shift(); // Keep last 50 points

          return {
            ...plant,
            state: {
              ...plant.state,
              timestamp: now,
            },
            history: newHistory,
          };
        });

        // Handle correlation logs sent from the backend
        if (data.correlations && data.correlations.length > 0) {
          setLogs(prev => {
            const newLogs = data.correlations.map((c: any) => ({
              id: Math.random().toString(36).substr(2, 9),
              timestamp: now,
              plantIds: c.plantIds,
              similarityScore: c.score,
              condition: 'Live Data'
            }));
            return [...newLogs, ...prev].slice(0, 50);
          });
        }

        setPlants(updatedPlants);
      } catch (err) {
        console.error('Error parsing WebSocket data:', err);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from Bio-Hybrid WebSocket');
      setIsConnected(false);
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (!isPaused) {
          setIsPaused(false); // Trigger re-render to reconnect
        }
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.close();
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isPaused]);

  const applyStimulus = useCallback((stimulus: Stimulus) => {
    // In a real hardware setup, this would send a message to the backend
    // to trigger a physical relay (e.g., turn on a water pump or light).
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'stimulus',
        type: stimulus.type,
        target: stimulus.targetPlantId || 'all',
        intensity: stimulus.intensity
      }));
    }

    // Optimistic UI update
    setPlants(prev => prev.map(plant => {
      if (stimulus.targetPlantId && stimulus.targetPlantId !== plant.state.id) {
        return plant;
      }
      return {
        ...plant,
        state: { ...plant.state, lastStimulus: stimulus.type }
      };
    }));

    // Clear the stimulus label after a few seconds
    setTimeout(() => {
      setPlants(prev => prev.map(plant => {
        if (plant.state.lastStimulus === stimulus.type) {
          return { ...plant, state: { ...plant.state, lastStimulus: null } };
        }
        return plant;
      }));
    }, 3000);

  }, []);

  return {
    plants,
    logs,
    applyStimulus,
    isPaused,
    setIsPaused,
    isConnected
  };
}
