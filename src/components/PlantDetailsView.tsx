import { PlantData } from '../types';
import { Oscilloscope } from './Oscilloscope';
import { HealthMonitor } from './HealthMonitor';
import { Activity, Droplets, Sun, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';

interface PlantDetailsViewProps {
  plants: PlantData[];
}

export function PlantDetailsView({ plants }: PlantDetailsViewProps) {
  const [selectedPlantId, setSelectedPlantId] = useState<string>(plants[0]?.state.id);

  const selectedPlant = plants.find(p => p.state.id === selectedPlantId) || plants[0];

  if (!selectedPlant) return null;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {plants.map((plant) => (
          <button
            key={plant.state.id}
            onClick={() => setSelectedPlantId(plant.state.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border",
              selectedPlantId === plant.state.id
                ? "bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/30 shadow-[0_0_10px_rgba(0,255,136,0.1)]"
                : "bg-black/20 text-zinc-400 border-white/5 hover:bg-white/5 hover:text-zinc-300"
            )}
          >
            {plant.state.name}
          </button>
        ))}
      </div>

      <div className="glass-panel rounded-xl p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{selectedPlant.state.name}</h2>
            <div className="flex items-center gap-3 text-sm font-mono text-zinc-400">
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                {selectedPlant.state.species}
              </span>
              <span>ID: {selectedPlant.state.id}</span>
            </div>
          </div>
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-mono font-bold border",
            selectedPlant.state.stressLevel > 50 
              ? "bg-red-500/10 text-red-400 border-red-500/30" 
              : "bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/30"
          )}>
            {selectedPlant.state.stressLevel > 50 ? 'HIGH STRESS' : 'OPTIMAL'}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Live Electrophysiological Feed
            </h3>
            <div className="h-[300px]">
              <Oscilloscope 
                data={selectedPlant.history} 
                height={300} 
                color={selectedPlant.state.stressLevel > 50 ? '#ef4444' : '#00FF88'} 
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-wider">
              Vital Statistics
            </h3>
            <div className="space-y-4">
              <HealthMetricCard 
                label="Stress Level" 
                value={selectedPlant.state.stressLevel} 
                unit="%" 
                icon={AlertTriangle}
                color={selectedPlant.state.stressLevel > 50 ? 'text-red-500' : 'text-[#00FF88]'}
                barColor={selectedPlant.state.stressLevel > 50 ? 'bg-red-500' : 'bg-[#00FF88]'}
              />
              <HealthMetricCard 
                label="Hydration" 
                value={selectedPlant.state.hydration} 
                unit="%" 
                icon={Droplets}
                color={selectedPlant.state.hydration < 30 ? 'text-red-500' : selectedPlant.state.hydration < 60 ? 'text-yellow-500' : 'text-blue-500'}
                barColor={selectedPlant.state.hydration < 30 ? 'bg-red-500' : selectedPlant.state.hydration < 60 ? 'bg-yellow-500' : 'bg-blue-500'}
              />
              <HealthMetricCard 
                label="Light Absorption" 
                value={selectedPlant.state.lightLevel} 
                unit="%" 
                icon={Sun}
                color="text-yellow-500"
                barColor="bg-yellow-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthMetricCard({ label, value, unit, icon: Icon, color, barColor }: any) {
  return (
    <div className="bg-black/20 border border-white/5 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">{label}</span>
        <Icon className={cn("w-4 h-4", color)} />
      </div>
      <div className="flex items-end gap-1 mb-3">
        <span className="text-2xl font-mono font-bold text-white">{value.toFixed(1)}</span>
        <span className="text-xs text-zinc-500 mb-1">{unit}</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-500", barColor)} 
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
