import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp } from 'lucide-react';
import dayjs from 'dayjs';
import type { CheckInRecord } from '../types';

interface ScoreChartProps {
  history: CheckInRecord[];
}

const SECTION_LABELS: Record<string, string> = {
  'reading-careful': '仔细阅读',
  'reading-long-vocab': '长篇+词汇',
  'listening': '听力',
  'writing': '写作',
  'translation': '翻译'
};

const SECTION_COLORS: Record<string, string> = {
  'reading-careful': '#3b82f6',
  'reading-long-vocab': '#6366f1',
  'listening': '#a855f7',
  'writing': '#f97316',
  'translation': '#10b981'
};

export const ScoreChart: React.FC<ScoreChartProps> = ({ history }) => {
  // 1. 处理趋势数据 (按日期分组)
  const trendData = useMemo(() => {
    const trainingRecords = history
      .filter(r => r.type === 'training' && r.score !== undefined)
      .sort((a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix());

    const groups: Record<string, Record<string, string | number>> = {};
    
    trainingRecords.forEach(r => {
      const date = dayjs(r.createdAt).format('MM-DD');
      if (!groups[date]) {
        groups[date] = { date };
      }
      if (r.section) {
        groups[date][r.section] = Math.round(r.score || 0);
      }
    });

    return Object.values(groups).slice(-7); // 只展示最近7个有记录的天
  }, [history]);

  // 2. 计算本周总分汇总
  const weeklySummary = useMemo(() => {
    const startOfWeek = dayjs().startOf('week');
    const thisWeekRecords = history.filter(r => 
      r.type === 'training' && 
      dayjs(r.createdAt).isAfter(startOfWeek)
    );

    const scores: Record<string, number> = {
      'reading-careful': 0,
      'reading-long-vocab': 0,
      'listening': 0,
      'writing': 106.5, // 默认固定分，等 OCR
      'translation': 106.5 // 默认固定分
    };

    thisWeekRecords.forEach(r => {
      if (r.section && r.score) {
        scores[r.section] = r.score;
      }
    });

    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    return { scores, total };
  }, [history]);

  return (
    <div className="space-y-6">
      <Card className="theme-card border-none shadow-md bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-2 border-b border-border/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            专项得分趋势
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold' }}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderRadius: '12px', 
                    border: '1px solid hsl(var(--border))',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold' }} />
                {Object.keys(SECTION_LABELS).map(key => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={SECTION_LABELS[key]}
                    stroke={SECTION_COLORS[key]}
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="theme-card border-none shadow-md bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <BarChart3 className="w-4 h-4" />
            本周预计总分汇总 (满分 710)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="text-5xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
              {Math.round(weeklySummary.total)}
            </div>
            <div className="mb-2 text-xs font-bold text-muted-foreground">
              / 710 PTS
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(SECTION_LABELS).map(([key, label]) => (
              <div key={key} className="p-3 bg-background/50 rounded-xl border border-border/50">
                <div className="text-[10px] font-bold text-muted-foreground mb-1">{label}</div>
                <div className="text-sm font-black" style={{ color: SECTION_COLORS[key] }}>
                  {Math.round(weeklySummary.scores[key] || 0)}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[10px] text-muted-foreground italic">
            * 写作与翻译目前取固定平均分，待 OCR 接入后将支持精准打分。
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
