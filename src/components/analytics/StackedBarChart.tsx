import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { TeamMember, Task, PRIORITY_COLORS, PRIORITY_LABELS } from '../../types';

interface StackedBarChartProps {
  members: TeamMember[];
  tasks: Task[];
}

export const StackedBarChart = ({ members, tasks }: StackedBarChartProps) => {
  const data = members.map(member => {
    const memberTasks = tasks.filter(t => t.member_id === member.id);
    return {
      name: member.name,
      'Prio 1': memberTasks.find(t => t.priority === '1')?.effort_hours || 0,
      'Prio 2': memberTasks.find(t => t.priority === '2')?.effort_hours || 0,
      'Prio 3': memberTasks.find(t => t.priority === '3')?.effort_hours || 0,
      'Prio 4': memberTasks.find(t => t.priority === '4')?.effort_hours || 0,
      'ALS': memberTasks.find(t => t.priority === 'ALS')?.effort_hours || 0,
    };
  });

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis 
            type="number" 
            domain={[0, 40]} 
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
          />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 700 }}
          />
          <Bar dataKey="Prio 1" stackId="a" fill={PRIORITY_COLORS['1']} radius={[0, 0, 0, 0]} />
          <Bar dataKey="Prio 2" stackId="a" fill={PRIORITY_COLORS['2']} />
          <Bar dataKey="Prio 3" stackId="a" fill={PRIORITY_COLORS['3']} />
          <Bar dataKey="Prio 4" stackId="a" fill={PRIORITY_COLORS['4']} />
          <Bar dataKey="ALS" stackId="a" fill={PRIORITY_COLORS['ALS']} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
