import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import type { CheckInRecord } from '../types';

interface CheckInCalendarProps {
  history: CheckInRecord[];
}

export const CheckInCalendar: React.FC<CheckInCalendarProps> = ({ history }) => {
  const [currentMonth, setCurrentMonth] = React.useState(dayjs());

  const daysInMonth = currentMonth.daysInMonth();
  const firstDayOfMonth = currentMonth.startOf('month').day();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }, (_, i) => i);

  const checkInDates = new Set(
    history.map(record => dayjs(record.createdAt).format('YYYY-MM-DD'))
  );

  const prevMonth = () => setCurrentMonth(currentMonth.subtract(1, 'month'));
  const nextMonth = () => setCurrentMonth(currentMonth.add(1, 'month'));

  return (
    <Card className="theme-card">
      <CardHeader className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-500" />
            打卡日历
          </CardTitle>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-1 hover:bg-muted rounded-md transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold min-w-[80px] text-center">
              {currentMonth.format('YYYY年MM月')}
            </span>
            <button onClick={nextMonth} className="p-1 hover:bg-muted rounded-md transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['一', '二', '三', '四', '五', '六', '日'].map(d => (
            <div key={d} className="text-[10px] font-bold text-slate-400 uppercase">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {blanks.map(b => <div key={`blank-${b}`} />)}
          {days.map(day => {
            const dateStr = currentMonth.date(day).format('YYYY-MM-DD');
            const isCheckedIn = checkInDates.has(dateStr);
            const isToday = dayjs().format('YYYY-MM-DD') === dateStr;

            return (
              <div 
                key={day} 
                className={cn(
                  "aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative transition-all",
                  isCheckedIn ? "bg-green-500/20 text-green-600 font-bold" : "hover:bg-muted/50",
                  isToday && !isCheckedIn && "border border-indigo-500/50 text-indigo-600"
                )}
              >
                {day}
                {isCheckedIn && (
                  <div className="absolute bottom-1 w-1 h-1 bg-green-500 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-4 text-[10px] text-slate-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500/20 border border-green-500/20 rounded-sm" />
            <span>已打卡</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 border border-indigo-500/50 rounded-sm" />
            <span>今日待办</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
