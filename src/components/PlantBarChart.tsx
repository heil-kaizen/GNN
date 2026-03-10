import { PlantData } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

interface PlantBarChartProps {
  plants: PlantData[];
  metric: 'stressLevel' | 'hydration' | 'lightLevel';
}

export function PlantBarChart({ plants, metric }: PlantBarChartProps) {
  const data = plants.map(p => ({
    name: p.state.name,
    value: p.state[metric],
    species: p.state.species
  }));

  const getBarColor = (val: number) => {
    if (metric === 'stressLevel') return val > 50 ? '#ef4444' : '#10b981';
    if (metric === 'hydration') return val < 30 ? '#ef4444' : '#3b82f6';
    return '#eab308';
  };

  return (
    <div className="h-[500px] w-full glass-panel rounded-xl p-6">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            interval={0} 
            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
            height={80}
          />
          <YAxis 
            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
            itemStyle={{ color: '#fff', fontFamily: 'monospace' }}
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
