import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TeamMember, Task, Category } from '../../types';
import { aggregateByMemberCategory } from '../../utils/analytics';

interface StackedBarChartProps {
  members: TeamMember[];
  tasks: Task[];
  categories: Category[];
  highlightedCategory: string | null;
  onHoverCategory: (abbr: string | null) => void;
}

export const StackedBarChart = ({ 
  members, 
  tasks, 
  categories, 
  highlightedCategory, 
  onHoverCategory 
}: StackedBarChartProps) => {
  const data = aggregateByMemberCategory(members, tasks, categories);

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis 
            type="number" 
            domain={[0, 'dataMax + 5']} 
            tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            tick={{ fontSize: 12, fontWeight: 700, fill: '#475569' }} 
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 rounded-xl shadow-2xl border border-slate-100 min-w-[150px]">
                    <div className="text-xs font-black text-slate-800 uppercase mb-3 pb-1.5 border-b border-slate-50">{label}</div>
                    <div className="space-y-2">
                      {payload.map((entry: any, i: number) => {
                        const cat = categories.find(c => c.abbreviation === entry.dataKey);
                        if (!entry.value) return null;
                        return (
                          <div key={i} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                              <span className="text-[10px] font-bold text-slate-600 truncate">
                                {cat?.fullName || entry.dataKey}
                              </span>
                            </div>
                            <span className="text-[10px] font-black text-slate-800">{entry.value}h</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 700 }}
            content={(props) => {
              const { payload } = props;
              return (
                <div className="flex justify-end gap-3 mb-6">
                  {payload?.map((entry: any, index: number) => {
                    const isHighlighted = highlightedCategory === null || highlightedCategory === entry.dataKey;
                    return (
                      <div 
                        key={`leg-${index}`}
                        className={`flex items-center gap-1.5 cursor-pointer transition-all ${isHighlighted ? 'opacity-100' : 'opacity-20'}`}
                        onMouseEnter={() => onHoverCategory(entry.dataKey)}
                        onMouseLeave={() => onHoverCategory(null)}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">{entry.value}</span>
                      </div>
                    );
                  })}
                </div>
              );
            }}
          />
          
          {categories.map((cat, i) => (
            <Bar 
              key={cat.id}
              dataKey={cat.abbreviation} 
              stackId="a" 
              fill={cat.color} 
              opacity={highlightedCategory === null || highlightedCategory === cat.abbreviation ? 1 : 0.15}
              radius={i === 0 ? [0, 0, 0, 0] : (i === categories.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0])}
              onMouseEnter={() => onHoverCategory(cat.abbreviation)}
              onMouseLeave={() => onHoverCategory(null)}
              className="transition-opacity duration-300 cursor-pointer outline-none"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
