import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';
import { PRIORITY_COLORS } from '../../types';

interface TrendLineChartProps {
  memberId: number;
}

export const TrendLineChart = ({ memberId }: TrendLineChartProps) => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/analytics/trend/${memberId}`)
      .then(res => res.json())
      .then(history => {
        // Group by week
        const weeks: Record<string, any> = {};
        history.forEach((h: any) => {
          const key = `W${h.week_number}`;
          if (!weeks[key]) weeks[key] = { name: key, capacity: h.capacity };
          weeks[key][`Prio ${h.priority}`] = h.effort;
        });
        setData(Object.values(weeks).reverse());
      });
  }, [memberId]);

  return (
    <div className="h-[200px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
          {data.map((d, i) => d.capacity < 38 && (
            <React.Fragment key={i}>
              <ReferenceArea 
                x1={d.name} 
                x2={d.name} 
                {...{
                  fill: "#fb923c",
                  fillOpacity: 0.05,
                  stroke: "#fb923c",
                  strokeOpacity: 0.1,
                  strokeDasharray: "3 3"
                } as any}
              />
            </React.Fragment>
          ))}
          <Line type="monotone" dataKey="Prio 1" stroke={PRIORITY_COLORS['1']} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="Prio 2" stroke={PRIORITY_COLORS['2']} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="Prio 3" stroke={PRIORITY_COLORS['3']} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="Prio 4" stroke={PRIORITY_COLORS['4']} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
