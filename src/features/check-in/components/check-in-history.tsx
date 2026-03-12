import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { CheckInRecord } from '../types';
import dayjs from 'dayjs';
import { Quote } from 'lucide-react';

interface CheckInHistoryProps {
  history: CheckInRecord[];
}

export const CheckInHistory: React.FC<CheckInHistoryProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-12 theme-subtle italic">
        还没有打卡记录哦，快去开启第一次打卡吧！✨
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold flex items-center gap-2 ml-1 theme-text">
        <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
        近期记录
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {history.map((record) => (
          <Card key={record.id} className="theme-card overflow-hidden group hover:shadow-md transition-all">
            <div className="aspect-video relative overflow-hidden bg-muted">
              <img 
                src={record.imageUrl} 
                alt="Check in" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] text-white font-bold">
                {dayjs(record.createdAt).format('MM-DD HH:mm')}
              </div>
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-yellow-500 text-black rounded text-[10px] font-black shadow-lg">
                +{record.pointsEarned} PTS
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
              {record.content && (
                <p className="text-sm theme-text line-clamp-2 italic font-medium">
                  "{record.content}"
                </p>
              )}
              <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100/50 dark:border-blue-800/50">
                <div className="flex gap-2">
                  <Quote className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-600 dark:text-blue-300 leading-relaxed">
                    {record.encouragement}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
