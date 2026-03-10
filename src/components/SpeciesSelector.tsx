import { PlantSpecies } from '../types';
import { cn } from '../lib/utils';

interface SpeciesSelectorProps {
  current: PlantSpecies;
  onChange: (s: PlantSpecies) => void;
}

const SPECIES: PlantSpecies[] = ['Fern', 'Succulent', 'Orchid', 'Basil'];

export function SpeciesSelector({ current, onChange }: SpeciesSelectorProps) {
  return (
    <div className="flex gap-1 glass-panel p-1 rounded-lg inline-flex">
      {SPECIES.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-all",
            current === s 
              ? "bg-[#00FF88]/10 text-[#00FF88] shadow-sm" 
              : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
