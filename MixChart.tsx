import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { MixRatio } from '../types';

interface MixChartProps {
  mixRatio: MixRatio;
}

const COLORS = ['#10B981', '#B45309', '#F59E0B', '#6B7280']; // Green, Brown, Yellow, Gray

const MixChart: React.FC<MixChartProps> = ({ mixRatio }) => {
  const data = [
    { name: 'Plastic', value: mixRatio.plasticKg },
    { name: 'Soil', value: mixRatio.soilKg },
    { name: 'Sand', value: mixRatio.sandKg },
    { name: 'Cement', value: mixRatio.cementKg },
  ].filter(item => item.value > 0);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`${value} kg`, 'Weight']}
            contentStyle={{ 
                backgroundColor: 'var(--tooltip-bg, white)', 
                color: 'var(--tooltip-color, black)',
                borderRadius: '8px', 
                border: 'none', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
            }}
            itemStyle={{ color: 'inherit' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            formatter={(value) => <span className="text-gray-600 dark:text-slate-300 ml-1">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MixChart;