interface ProgressStatsProps {
  completed: number;
  total: number;
  overallCompleted: number;
  label: string;
  dailyGoal: number;
}

export const ProgressStats = ({ completed, total, overallCompleted, label, dailyGoal }: ProgressStatsProps) => {
  const percentage = Math.round((overallCompleted / total) * 100);
  
  return (
    <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 relative overflow-hidden group">
      <div className="flex justify-between items-start mb-3 relative z-10">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black theme-text">{overallCompleted}</span>
            <span className="text-xs text-muted-foreground font-bold">/ {total}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-tight mb-1">Daily Goal</p>
          <p className="text-sm font-black theme-text">{completed} / {dailyGoal}</p>
        </div>
      </div>
      
      <div className="space-y-1 relative z-10">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/60">
          <span>Overall Progress</span>
          <span>{percentage}%</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_8px_rgba(var(--primary),0.4)]"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
