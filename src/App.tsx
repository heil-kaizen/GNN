import { useState } from 'react';
import { usePlantSystem } from './hooks/usePlantSystem';
import { PlantGrid } from './components/PlantGrid';
import { PlantDetailsView } from './components/PlantDetailsView';
import { BioHybridInterface } from './components/BioHybridInterface';
import { CorrelationLogView } from './components/CorrelationLogView';
import { ControlPanel } from './components/ControlPanel';
import { DocumentationView } from './components/DocumentationView';
import { Activity, Leaf, Wifi, Grid, Pause, Play, FileText, List, Brain } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const { 
    plants, 
    logs, 
    applyStimulus,
    isPaused,
    setIsPaused
  } = usePlantSystem();

  const [viewMode, setViewMode] = useState<'grid' | 'details' | 'bhli' | 'doc'>('grid');
  const [barMetric, setBarMetric] = useState<'stressLevel' | 'hydration' | 'lightLevel'>('stressLevel');

  return (
    <div className="min-h-screen text-white font-sans selection:bg-[#00FF88]/30 relative z-0">
      <div className="aurora-bg">
        <div className="aurora-glow-1"></div>
        <div className="aurora-glow-2"></div>
        <div className="aurora-glow-3"></div>
      </div>
      {/* Header */}
      <header className="border-b border-white/10 glass-panel sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00FF88]/10 flex items-center justify-center border border-[#00FF88]/20 shadow-[0_0_15px_rgba(0,255,136,0.15)]">
              <Leaf className="w-5 h-5 text-[#00FF88]" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">Green Neural Network</h1>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse shadow-[0_0_8px_rgba(0,255,136,0.6)]" />
                System Online • 20 Nodes Active
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs font-mono text-zinc-400">
              <Wifi className="w-3 h-3" />
              <span>SIGNAL: STRONG</span>
            </div>
            <button 
              onClick={() => setIsPaused(!isPaused)}
              className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
            >
              {isPaused ? <Play className="w-4 h-4 text-zinc-500" /> : <Pause className="w-4 h-4 text-[#00FF88] drop-shadow-[0_0_5px_rgba(0,255,136,0.4)]" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        
        {/* Controls & Tabs */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="flex glass-panel p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                viewMode === 'grid' ? "bg-[#00FF88]/10 text-[#00FF88] shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Grid className="w-4 h-4" />
              Waveform Grid
            </button>
            <button
              onClick={() => setViewMode('details')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                viewMode === 'details' ? "bg-[#00FF88]/10 text-[#00FF88] shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <List className="w-4 h-4" />
              Plant Details
            </button>
            <button
              onClick={() => setViewMode('bhli')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                viewMode === 'bhli' ? "bg-[#00FF88]/10 text-[#00FF88] shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Brain className="w-4 h-4" />
              Bio-Hybrid AI
            </button>
            <button
              onClick={() => setViewMode('doc')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                viewMode === 'doc' ? "bg-[#00FF88]/10 text-[#00FF88] shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <FileText className="w-4 h-4" />
              Research Docs
            </button>
          </div>

          <div className="glass-panel rounded-xl p-2">
            <ControlPanel onStimulus={applyStimulus} disabled={isPaused} />
          </div>
        </div>

        {/* Main Content Area */}
        {viewMode === 'doc' ? (
          <DocumentationView />
        ) : viewMode === 'bhli' ? (
          <BioHybridInterface plants={plants} onStimulus={applyStimulus} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Left: Visualization (3 cols) */}
            <div className="lg:col-span-3 min-h-[500px]">
              {viewMode === 'grid' ? (
                <PlantGrid plants={plants} />
              ) : (
                <PlantDetailsView plants={plants} />
              )}
            </div>

            {/* Right: Logs (1 col) */}
            <div className="lg:col-span-1">
              <CorrelationLogView logs={logs} plants={plants} />
            </div>

          </div>
        )}

        {/* Footer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Network Status</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Monitoring 20 distinct bio-nodes. Real-time correlation engine active. 
              Detecting synchronous electrical events across species boundaries.
            </p>
          </div>
          <div className="text-right">
            <div className="inline-block text-left">
              <div className="text-xs font-mono text-zinc-500 mb-1">SESSION HASH</div>
              <div className="text-sm font-mono text-zinc-300">GNN-MULTI-{Math.floor(Date.now() / 1000).toString(16).toUpperCase()}</div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
