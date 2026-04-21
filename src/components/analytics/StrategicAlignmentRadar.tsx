import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { aggregateByWeight } from '../../utils/analytics';
import { Task, Category } from '../../types';

interface StrategicAlignmentRadarProps {
  tasks: Task[];
  categories: Category[];
}

export const StrategicAlignmentRadar = ({ tasks, categories }: StrategicAlignmentRadarProps) => {
  const data = aggregateByWeight(tasks, categories);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#f1f5f9" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 'auto']} 
            tick={{ fontSize: 8, fill: '#94a3b8' }}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 rounded-xl shadow-2xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      {payload[0].payload.subject}
                    </div>
                    <div className="text-sm font-black text-slate-800">
                      {payload[0].value} Hours
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Radar
            name="Effort"
            dataKey="A"
            stroke="#FF4208"
            fill="#FF4208"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
