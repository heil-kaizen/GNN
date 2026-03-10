import { useMemo } from 'react';
import { SignalDataPoint } from '../types';
import { motion } from 'motion/react';

interface OscilloscopeProps {
  data: SignalDataPoint[];
  color?: string;
  height?: number;
}

export function Oscilloscope({ data, color = '#10b981', height = 200 }: OscilloscopeProps) {
  const points = useMemo(() => {
    if (data.length === 0) return '';
    
    const width = 1000; // Internal SVG coordinate width
    const maxVoltage = 20; // Reduced from 50 to 20 to significantly increase vertical size (2.5x gain)
    
    // Map data points to SVG coordinates
    // X is distributed evenly
    // Y is centered at height/2
    
    const path = data.map((point, index) => {
      const x = (index / (data.length - 1)) * width;
      // Invert Y because SVG Y grows downwards
      // Center is height/2
      // Scale voltage: 20uV -> height/2 pixels * 0.95 (almost full height)
      const y = (height / 2) - (point.voltage / maxVoltage) * (height / 2) * 0.95; 
      return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');

    return path;
  }, [data, height]);

  return (
    <div className="relative w-full bg-black/90 rounded-xl border border-white/10 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)_inset]">
      {/* Grid Lines */}
      <div className="absolute inset-0 grid grid-cols-10 grid-rows-4 pointer-events-none opacity-30">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="border border-emerald-500/30" />
        ))}
      </div>
      
      {/* Scanline effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent animate-scanline pointer-events-none" />

      <svg 
        viewBox={`0 0 1000 ${height}`} 
        className="w-full h-full relative z-10"
        preserveAspectRatio="none"
      >
        <motion.path
          d={points}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          // We don't animate the path change with Framer Motion because it's too fast (20Hz)
          // React will handle the DOM update efficiently enough for this resolution
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      
      {/* Axis Labels */}
      <div className="absolute bottom-2 left-2 text-[10px] font-mono text-emerald-500/50">
        TIME (ms)
      </div>
      <div className="absolute top-2 right-2 text-[10px] font-mono text-emerald-500/50">
        VOLTAGE (µV)
      </div>
    </div>
  );
}
