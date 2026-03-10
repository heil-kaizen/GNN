import { PlantState, PlantSpecies } from '../types';
import { Activity, Droplets, Sun, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

interface HealthMonitorProps {
  state: PlantState;
}

export function HealthMonitor({ state }: HealthMonitorProps) {
  const getStatusColor = (val: number, type: 'stress' | 'hydration' | 'light') => {
    if (type === 'stress') return val > 50 ? 'text-red-500' : val > 20 ? 'text-yellow-500' : 'text-emerald-500';
    if (type === 'hydration') return val < 30 ? 'text-red-500' : val < 60 ? 'text-yellow-500' : 'text-blue-500';
    return 'text-emerald-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatusCard 
        label="Stress Level" 
        value={state.stressLevel} 
        unit="%" 
        icon={AlertTriangle}
        color={getStatusColor(state.stressLevel, 'stress')}
        barColor={state.stressLevel > 50 ? 'bg-red-500' : 'bg-emerald-500'}
      />
      <StatusCard 
        label="Hydration" 
        value={state.hydration} 
        unit="%" 
        icon={Droplets}
        color={getStatusColor(state.hydration, 'hydration')}
        barColor="bg-blue-500"
      />
      <StatusCard 
        label="Light Absorption" 
        value={state.lightLevel} 
        unit="%" 
        icon={Sun}
        color="text-yellow-500"
        barColor="bg-yellow-500"
      />
    </div>
  );
}

function StatusCard({ label, value, unit, icon: Icon, color, barColor }: any) {
  return (
    <div className="glass-panel rounded-xl p-4">
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
