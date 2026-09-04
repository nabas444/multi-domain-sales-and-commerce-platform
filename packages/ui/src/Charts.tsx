'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

// Design-token palette mapping
export const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  danger: 'hsl(var(--danger))',
  info: 'hsl(var(--info))',
  muted: 'hsl(var(--foreground-muted))',
  subtle: 'hsl(var(--foreground-subtle))',
  surface: 'hsl(var(--surface-muted))',
  border: 'hsl(var(--border))',
  palette: [
    'hsl(var(--primary))',
    'hsl(var(--info))',
    'hsl(var(--success))',
    'hsl(var(--warning))',
    'hsl(var(--danger))',
    'hsl(var(--foreground-muted))',
  ],
};

export interface TrendDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface TrendAreaChartProps {
  data: TrendDataPoint[];
  categories: { key: string; label: string; color?: string }[];
  height?: number;
  className?: string;
}

export const TrendAreaChart: React.FC<TrendAreaChartProps> = ({
  data,
  categories,
  height = 260,
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {categories.map((cat, idx) => {
              const color = cat.color || CHART_COLORS.palette[idx % CHART_COLORS.palette.length];
              return (
                <linearGradient key={cat.key} id={`gradient-${cat.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey="name"
            stroke="hsl(var(--foreground-muted))"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis
            stroke="hsl(var(--foreground-muted))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--card-border))',
              borderRadius: 'calc(var(--radius) - 2px)',
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)',
              color: 'hsl(var(--foreground))',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          {categories.map((cat, idx) => {
            const color = cat.color || CHART_COLORS.palette[idx % CHART_COLORS.palette.length];
            return (
              <Area
                key={cat.key}
                type="monotone"
                dataKey={cat.key}
                name={cat.label}
                stroke={color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#gradient-${cat.key})`}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export interface ComparisonBarChartProps {
  data: { name: string; value: number; [key: string]: any }[];
  dataKey?: string;
  nameKey?: string;
  color?: string;
  height?: number;
  className?: string;
}

export const ComparisonBarChart: React.FC<ComparisonBarChartProps> = ({
  data,
  dataKey = 'value',
  nameKey = 'name',
  color = 'hsl(var(--primary))',
  height = 240,
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey={nameKey}
            stroke="hsl(var(--foreground-muted))"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis
            stroke="hsl(var(--foreground-muted))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--card-border))',
              borderRadius: 'calc(var(--radius) - 2px)',
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)',
              color: 'hsl(var(--foreground))',
            }}
          />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export interface CompositionDonutChartProps {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  className?: string;
}

export const CompositionDonutChart: React.FC<CompositionDonutChartProps> = ({
  data,
  height = 240,
  innerRadius = 55,
  outerRadius = 80,
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--card-border))',
              borderRadius: 'calc(var(--radius) - 2px)',
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)',
              color: 'hsl(var(--foreground))',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} verticalAlign="bottom" height={36} />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => {
              const color = entry.color || CHART_COLORS.palette[index % CHART_COLORS.palette.length];
              return <Cell key={`cell-${index}`} fill={color} stroke="hsl(var(--card))" strokeWidth={2} />;
            })}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
