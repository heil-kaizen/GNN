import { CorrelationLog, PlantData } from '../types';
import { Clock, Zap, GitMerge } from 'lucide-react';

interface CorrelationLogViewProps {
  logs: CorrelationLog[];
  plants: PlantData[];
}

export function CorrelationLogView({ logs, plants }: CorrelationLogViewProps) {
  const getPlantName = (id: string) => plants.find(p => p.state.id === id)?.state.name || id;

  return (
    <div className="glass-panel rounded-xl overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <h3 className="font-mono text-xs text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <GitMerge className="w-4 h-4" />
          Neural Correlation Log
        </h3>
        <span className="text-[10px] text-zinc-600 font-mono">LIVE FEED</span>
      </div>
      
      <div className="overflow-y-auto p-4 space-y-2 max-h-[300px] scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 font-mono text-xs">
            Waiting for signal correlation...
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="bg-black/20 border border-white/5 rounded p-3 text-xs font-mono animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 text-zinc-500">
                  <Clock className="w-3 h-3" />
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
                  log.condition === 'Random' ? 'bg-zinc-800 text-zinc-400' : 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/20'
                }`}>
                  <Zap className="w-3 h-3" />
                  {log.condition.toUpperCase()}
                </div>
              </div>
              
              <div className="text-zinc-300 mb-1">
                <span className="text-zinc-500">MATCH:</span> {log.plantIds.map(id => getPlantName(id)).join(', ')}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500" 
                    style={{ width: `${log.similarityScore}%` }}
                  />
                </div>
                <span className="text-indigo-400">{log.similarityScore.toFixed(1)}% SIMILARITY</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
