'use client';

import React from 'react';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';

interface MiniSalesChartProps {
  salesData?: { period: string; sales: number }[];
}

export default function MiniSalesChart({ salesData = [] }: MiniSalesChartProps) {
  // 第9期から第14期までのデータを準備
  const periods = ['9', '10', '11', '12', '13', '14'];
  const chartData = periods.map(period => {
    const data = salesData.find(d => d.period === period);
    return {
      period: `第${period}期`,
      売上高: data ? data.sales : 0
    };
  });

  // データがない場合は空のプレースホルダーを表示
  if (!salesData || salesData.length === 0) {
    return (
      <div className="h-10 w-32 bg-gray-50 rounded"></div>
    );
  }

  return (
    <div className="h-10 w-32">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 2, right: 4, left: 4, bottom: 0 }}>
          <Bar
            dataKey="売上高"
            fill="#6366F1"
            radius={[2, 2, 0, 0]}
            maxBarSize={14}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
