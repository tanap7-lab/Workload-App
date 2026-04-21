import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Label
} from 'recharts';
import { CategoryEffort } from '../../utils/analytics';

interface CategoryDonutChartProps {
  data: CategoryEffort[];
  highlightedCategory: string | null;
  onHoverCategory: (abbr: string | null) => void;
}

export const CategoryDonutChart = ({ data, highlightedCategory, onHoverCategory }: CategoryDonutChartProps) => {
  const totalHours = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={110}
            paddingAngle={5}
            dataKey="value"
            onMouseEnter={(d: any) => onHoverCategory(String(d.name))}
            onMouseLeave={() => onHoverCategory(null)}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                opacity={highlightedCategory === null || highlightedCategory === entry.name ? 1 : 0.2}
                className="transition-opacity duration-300 cursor-pointer outline-none"
              />
            ))}
            <Label
              value={`${totalHours}h`}
              position="center"
              fill="#1e293b"
              className="text-2xl font-black"
            />
            <Label
              value="Team Effort"
              position="center"
              offset={25}
              fill="#94a3b8"
              className="text-[10px] font-bold uppercase tracking-widest"
            />
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as CategoryEffort;
                return (
                  <div className="bg-white p-3 rounded-xl shadow-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{item.name}</span>
                    </div>
                    <div className="text-[10px] font-medium text-slate-400 mb-2">{item.fullName}</div>
                    <div className="flex justify-between items-end gap-4">
                      <span className="text-lg font-black text-slate-800">{item.value}h</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase pb-0.5">
                        {Math.round((item.value / totalHours) * 100)}% Share
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            align="center"
            content={(props) => {
              const { payload } = props;
              return (
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8">
                  {payload?.map((entry: any, index: number) => {
                    const item = entry.payload as CategoryEffort;
                    const isHighlighted = highlightedCategory === null || highlightedCategory === item.name;
                    return (
                      <div 
                        key={`legend-${index}`}
                        className={`flex items-center gap-2 cursor-pointer transition-all ${isHighlighted ? 'opacity-100 scale-100' : 'opacity-30 scale-95'}`}
                        onMouseEnter={() => onHoverCategory(item.name)}
                        onMouseLeave={() => onHoverCategory(null)}
                      >
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">{item.name}</span>
                        <span className="text-[10px] font-bold text-slate-400">{item.value}h</span>
                      </div>
                    );
                  })}
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
