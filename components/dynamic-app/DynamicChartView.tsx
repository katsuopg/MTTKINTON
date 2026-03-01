'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import type { ChartType, AggregationType } from '@/types/dynamic-app';

interface ChartRecord {
  data: Record<string, unknown>;
  [key: string]: unknown;
}

interface DynamicChartViewProps {
  records: ChartRecord[];
  chartType: ChartType;
  xField: string;
  yField?: string;
  groupField?: string;
  aggregation: AggregationType;
  locale: string;
  fieldLabels: Record<string, string>;
}

const CHART_COLORS = [
  '#465FFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#F97316', '#EC4899', '#14B8A6', '#6366F1',
];

interface AggregatedItem {
  name: string;
  value: number;
  [key: string]: string | number;
}

export default function DynamicChartView({
  records,
  chartType,
  xField,
  yField,
  groupField,
  aggregation,
  locale,
  fieldLabels,
}: DynamicChartViewProps) {
  // レコードデータを集計
  const chartData = useMemo(() => {
    if (!xField || records.length === 0) return [];

    const groups: Record<string, ChartRecord[]> = {};

    for (const record of records) {
      const xVal = String(record.data?.[xField] ?? record[xField] ?? '');
      const key = xVal || '(empty)';
      if (!groups[key]) groups[key] = [];
      groups[key].push(record);
    }

    const result: AggregatedItem[] = Object.entries(groups).map(([name, recs]) => {
      let value = 0;
      switch (aggregation) {
        case 'count':
          value = recs.length;
          break;
        case 'sum':
          value = recs.reduce((sum, r) => sum + (Number(r.data?.[yField!] ?? r[yField!] ?? 0) || 0), 0);
          break;
        case 'avg': {
          const total = recs.reduce((sum, r) => sum + (Number(r.data?.[yField!] ?? r[yField!] ?? 0) || 0), 0);
          value = recs.length > 0 ? total / recs.length : 0;
          break;
        }
        case 'max':
          value = Math.max(...recs.map(r => Number(r.data?.[yField!] ?? r[yField!] ?? 0) || 0));
          break;
        case 'min':
          value = Math.min(...recs.map(r => Number(r.data?.[yField!] ?? r[yField!] ?? 0) || 0));
          break;
      }
      return { name, value: Math.round(value * 100) / 100 };
    });

    // ソート
    result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [records, xField, yField, aggregation]);

  // グループ化されたデータ（棒/折れ線/面で凡例対応）
  const groupedData = useMemo(() => {
    if (!groupField || !xField || records.length === 0) return null;

    const allGroups = new Set<string>();
    const xGroups: Record<string, Record<string, ChartRecord[]>> = {};

    for (const record of records) {
      const xVal = String(record.data?.[xField] ?? record[xField] ?? '') || '(empty)';
      const gVal = String(record.data?.[groupField] ?? record[groupField] ?? '') || '(other)';
      allGroups.add(gVal);
      if (!xGroups[xVal]) xGroups[xVal] = {};
      if (!xGroups[xVal][gVal]) xGroups[xVal][gVal] = [];
      xGroups[xVal][gVal].push(record);
    }

    const groupNames = Array.from(allGroups).sort();
    const data = Object.entries(xGroups).map(([xVal, gMap]) => {
      const item: Record<string, string | number> = { name: xVal };
      for (const gName of groupNames) {
        const recs = gMap[gName] || [];
        let val = 0;
        if (aggregation === 'count') val = recs.length;
        else if (yField) {
          const nums = recs.map(r => Number(r.data?.[yField] ?? r[yField] ?? 0) || 0);
          if (aggregation === 'sum') val = nums.reduce((a, b) => a + b, 0);
          else if (aggregation === 'avg') val = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
          else if (aggregation === 'max') val = Math.max(...nums, 0);
          else if (aggregation === 'min') val = Math.min(...nums, 0);
        }
        item[gName] = Math.round(val * 100) / 100;
      }
      return item;
    });

    data.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return { data, groupNames };
  }, [records, xField, groupField, yField, aggregation]);

  const aggLabel = aggregation === 'count'
    ? (locale === 'ja' ? 'レコード数' : locale === 'th' ? 'จำนวน' : 'Count')
    : fieldLabels[yField || ''] || yField || '';

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {locale === 'ja' ? 'データがありません' : locale === 'th' ? 'ไม่มีข้อมูล' : 'No data available'}
        </p>
      </div>
    );
  }

  const renderChart = () => {
    const data = groupedData?.data || chartData;
    const groups = groupedData?.groupNames;

    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={140}
              dataKey="value"
              nameKey="name"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              label={({ name, percent }: any) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
              labelLine={true}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid',
                borderColor: 'rgb(209 213 219)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-gray-500 dark:text-gray-400" fontSize={12} />
            <YAxis tickLine={false} axisLine={false} className="text-gray-500 dark:text-gray-400" fontSize={12} />
            <Tooltip contentStyle={{ borderRadius: '8px' }} />
            {groups ? (
              groups.map((g, i) => (
                <Line key={g} type="monotone" dataKey={g} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
              ))
            ) : (
              <Line type="monotone" dataKey="value" stroke="#465FFF" strokeWidth={2} dot={{ r: 3 }} name={aggLabel} />
            )}
            {groups && <Legend />}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-gray-500 dark:text-gray-400" fontSize={12} />
            <YAxis tickLine={false} axisLine={false} className="text-gray-500 dark:text-gray-400" fontSize={12} />
            <Tooltip contentStyle={{ borderRadius: '8px' }} />
            {groups ? (
              groups.map((g, i) => (
                <Area key={g} type="monotone" dataKey={g} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.3} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} />
              ))
            ) : (
              <Area type="monotone" dataKey="value" fill="#465FFF" fillOpacity={0.3} stroke="#465FFF" strokeWidth={2} name={aggLabel} />
            )}
            {groups && <Legend />}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    // bar (default)
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-gray-500 dark:text-gray-400" fontSize={12} />
          <YAxis tickLine={false} axisLine={false} className="text-gray-500 dark:text-gray-400" fontSize={12} />
          <Tooltip contentStyle={{ borderRadius: '8px' }} />
          {groups ? (
            groups.map((g, i) => (
              <Bar key={g} dataKey={g} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
            ))
          ) : (
            <Bar dataKey="value" fill="#465FFF" radius={[4, 4, 0, 0]} name={aggLabel} />
          )}
          {groups && <Legend />}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      {renderChart()}
    </div>
  );
}
