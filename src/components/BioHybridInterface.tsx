import { useState, useEffect, useRef } from 'react';
import { PlantData } from '../types';
import { Brain, Sparkles, Activity, Cpu, Send, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from '@google/genai';

interface BioHybridInterfaceProps {
  plants: PlantData[];
  onStimulus: (type: 'water' | 'light' | 'sound') => void;
}

export function BioHybridInterface({ plants, onStimulus }: BioHybridInterfaceProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [bioMetrics, setBioMetrics] = useState({
    rms: 0,
    variance: 0,
    entropy: 0,
    correlation: 0
  });

  const outputRef = useRef<HTMLDivElement>(null);

  // Calculate bio-metrics from plant data
  useEffect(() => {
    if (!plants.length) return;

    let totalRms = 0;
    let totalVariance = 0;
    
    plants.forEach(plant => {
      const recentHistory = plant.history.slice(-20);
      if (recentHistory.length === 0) return;
      
      const mean = recentHistory.reduce((sum, val) => sum + val, 0) / recentHistory.length;
      const variance = recentHistory.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentHistory.length;
      const rms = Math.sqrt(recentHistory.reduce((sum, val) => sum + Math.pow(val, 2), 0) / recentHistory.length);
      
      totalRms += rms;
      totalVariance += variance;
    });

    const avgRms = totalRms / plants.length;
    const avgVariance = totalVariance / plants.length;
    
    // Simulated entropy and correlation based on variance and active plants
    const entropy = Math.min(1, avgVariance / 100 + Math.random() * 0.1);
    const correlation = Math.min(1, 0.5 + (avgRms / 200) + Math.random() * 0.2);

    setBioMetrics({
      rms: avgRms,
      variance: avgVariance,
      entropy,
      correlation
    });
  }, [plants]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setOutput('');
    
    try {
      // 1. Try to connect to the local Python FastAPI backend
      try {
        const response = await fetch('http://localhost:8000/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            rms: bioMetrics.rms,
            variance: bioMetrics.variance,
            entropy: bioMetrics.entropy,
            correlation: bioMetrics.correlation
          }),
        });

        if (response.ok) {
          const data = await response.json();
          await simulateTyping(`[PYTHON BACKEND CONNECTED]\nTemperature Used: ${data.temperature_used.toFixed(2)}\n\n${data.output}`);
          
          // Trigger feedback and exit early since backend succeeded
          triggerFeedback();
          return;
        }
      } catch (backendError) {
        console.log("Python backend not reachable at http://localhost:8000. Falling back to frontend logic.", backendError);
      }

      // 2. Fallback: Direct Gemini API call (if backend is not running)
      const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
      
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `You are the Bio-Hybrid Language Interface (BHLI). 
Your responses are modulated by the current electrophysiological state of a plant network.
Current Biological Entropy Parameters:
- RMS Amplitude: ${bioMetrics.rms.toFixed(2)}
- Temporal Variance: ${bioMetrics.variance.toFixed(2)}
- Spectral Entropy: ${(bioMetrics.entropy * 100).toFixed(1)}%
- Network Correlation: ${(bioMetrics.correlation * 100).toFixed(1)}%

If entropy is high, make your response more creative, chaotic, or organic.
If correlation is high, make your response highly structured and logical.
If RMS is high, convey a sense of high energy or urgency.
Reflect these biological states subtly in your tone and content.`;

        const responseStream = await ai.models.generateContentStream({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.7 + (bioMetrics.entropy * 0.5), // Modulate temperature with bio-entropy
          }
        });

        let fullText = '';
        for await (const chunk of responseStream) {
          fullText += chunk.text;
          setOutput(fullText);
          if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
          }
        }
      } else {
        // Fallback simulation if no API key
        await simulateTyping(`[BHLI SYSTEM ACTIVE]
Analyzing bio-entropy vectors...
RMS: ${bioMetrics.rms.toFixed(2)} | ENTROPY: ${(bioMetrics.entropy * 100).toFixed(1)}%

Response influenced by current plant network state:
The network senses your query: "${prompt}". 
Current bio-rhythms suggest a state of ${bioMetrics.entropy > 0.6 ? 'high volatility and creative flux' : 'stable equilibrium'}. 
The phloem pathways are resonating with ${bioMetrics.correlation > 0.7 ? 'synchronized clarity' : 'distributed processing patterns'}.

(Note: Add a Gemini API key to enable full LLM generation modulated by these bio-signals.)`);
      }

      triggerFeedback();

    } catch (error) {
      console.error("Generation error:", error);
      setOutput("Error: Connection to the bio-computational matrix severed. Please check API configuration.");
    } finally {
      setIsGenerating(false);
    }
  };

  const triggerFeedback = () => {
    // Bio-Cybernetic Feedback: Trigger a stimulus based on the interaction
    if (bioMetrics.entropy > 0.7) {
      onStimulus('sound');
    } else if (bioMetrics.correlation > 0.8) {
      onStimulus('light');
    } else {
      onStimulus('water');
    }
  };

  const simulateTyping = async (text: string) => {
    let current = '';
    for (let i = 0; i < text.length; i++) {
      current += text[i];
      setOutput(current);
      await new Promise(r => setTimeout(r, 20));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Bio-Metrics */}
      <div className="lg:col-span-1 space-y-6">
        <div className="glass-panel rounded-xl p-6 border-l-4 border-l-[#00FF88]">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#00FF88]" />
            Bio-Entropy Source
          </h3>
          <p className="text-sm text-zinc-400 mb-6">
            Real-time electrophysiological features modulating the LLM token probability distribution.
          </p>
          
          <div className="space-y-4">
            <MetricBar label="RMS Amplitude" value={Math.min(100, bioMetrics.rms)} max={100} color="bg-[#00FF88]" />
            <MetricBar label="Temporal Variance" value={Math.min(100, bioMetrics.variance / 2)} max={100} color="bg-emerald-400" />
            <MetricBar label="Spectral Entropy" value={bioMetrics.entropy * 100} max={100} color="bg-teal-400" />
            <MetricBar label="Network Correlation" value={bioMetrics.correlation * 100} max={100} color="bg-cyan-400" />
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            Cybernetic Feedback
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Generation events trigger environmental stimuli (light, water, sound) back to the plant network, creating a closed-loop bio-computational system.
          </p>
        </div>
      </div>

      {/* Right Column: Interface */}
      <div className="lg:col-span-2 glass-panel rounded-xl p-6 flex flex-col h-[600px]">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-lg bg-[#00FF88]/10 flex items-center justify-center border border-[#00FF88]/30">
            <Brain className="w-6 h-6 text-[#00FF88]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">BHLI Terminal</h2>
            <div className="text-xs font-mono text-[#00FF88] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
              Awaiting Input | Bio-Modulation Active
            </div>
          </div>
        </div>

        <div 
          ref={outputRef}
          className="flex-1 overflow-y-auto mb-6 bg-black/40 rounded-lg p-4 font-mono text-sm text-emerald-50 border border-white/5 whitespace-pre-wrap"
        >
          {output || (
            <span className="text-zinc-600">
              Initialize query to observe bio-modulated generation...
            </span>
          )}
          {isGenerating && (
            <span className="inline-block w-2 h-4 bg-[#00FF88] ml-1 animate-pulse" />
          )}
        </div>

        <div className="relative">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="Enter prompt for bio-modulated generation..."
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-4 pr-12 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00FF88]/50 focus:ring-1 focus:ring-[#00FF88]/50 transition-all font-mono text-sm"
            disabled={isGenerating}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md bg-[#00FF88]/10 text-[#00FF88] hover:bg-[#00FF88]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricBar({ label, value, max, color }: { label: string, value: number, max: number, color: string }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div>
      <div className="flex justify-between text-xs font-mono mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className="text-white">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-300", color)} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
