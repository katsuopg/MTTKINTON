'use client';

import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

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
      <div className="h-8 w-32 bg-gray-50 rounded"></div>
    );
  }

  // ユニークなIDを生成（複数チャートが同時に表示される場合の重複を防ぐ）
  const gradientId = `colorSales${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className="h-8 w-32">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={chartData} 
          margin={{ top: 1, right: 1, left: 1, bottom: 1 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="売上高" 
            stroke="#6366F1" 
            strokeWidth={1}
            fillOpacity={1} 
            fill={`url(#${gradientId})`} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}