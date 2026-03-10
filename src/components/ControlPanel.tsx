import { Stimulus } from '../types';
import { Zap, Droplets, Sun, Music } from 'lucide-react';

interface ControlPanelProps {
  onStimulus: (s: Stimulus) => void;
  disabled?: boolean;
}

export function ControlPanel({ onStimulus, disabled }: ControlPanelProps) {
  const buttons = [
    { label: 'Water', icon: Droplets, type: 'Water', color: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/50' },
    { label: 'Light Pulse', icon: Sun, type: 'Light', color: 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border-yellow-500/50' },
    { label: 'Touch', icon: Zap, type: 'Touch', color: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/50' },
    { label: 'Sound', icon: Music, type: 'Sound', color: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border-purple-500/50' },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          onClick={() => onStimulus({ type: btn.type as any, intensity: 80, duration: 2000 })}
          disabled={disabled}
          className={`
            flex items-center gap-2 px-4 py-3 rounded-lg border transition-all active:scale-95
            ${btn.color}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <btn.icon className="w-4 h-4" />
          <span className="font-mono text-sm font-medium">{btn.label}</span>
        </button>
      ))}
    </div>
  );
}
