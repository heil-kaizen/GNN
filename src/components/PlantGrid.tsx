import { PlantData } from '../types';
import { Oscilloscope } from './Oscilloscope';
import { cn } from '../lib/utils';

interface PlantGridProps {
  plants: PlantData[];
}

export function PlantGrid({ plants }: PlantGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {plants.map((plant) => (
        <div key={plant.state.id} className="glass-panel glass-panel-hover rounded-lg p-3 relative group transition-all duration-300">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[80px]">{plant.state.name}</span>
            <span className={cn(
              "text-[9px] px-1.5 py-0.5 rounded-full font-mono",
              plant.state.stressLevel > 50 ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
            )}>
              {plant.state.stressLevel > 50 ? 'STRESS' : 'OK'}
            </span>
          </div>
          
          <div className="h-48">
            <Oscilloscope 
              data={plant.history} 
              height={192} 
              color={plant.state.stressLevel > 50 ? '#ef4444' : '#10b981'} 
            />
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-[9px] font-mono text-zinc-500">
            <div>HYD: {plant.state.hydration.toFixed(0)}%</div>
            <div>LGT: {plant.state.lightLevel.toFixed(0)}%</div>
          </div>
        </div>
      ))}
    </div>
  );
}
