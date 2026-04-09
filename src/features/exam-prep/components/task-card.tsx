import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  id: string;
  title: string;
  isCompleted: boolean;
  onToggle: () => void;
}

export const TaskCard = ({ title, isCompleted, onToggle }: TaskCardProps) => {
  return (
    <div 
      onClick={onToggle}
      className={cn(
        "group flex items-start gap-3 p-4 rounded-2xl transition-all cursor-pointer border",
        isCompleted 
          ? "bg-primary/5 border-primary/20" 
          : "bg-card border-border hover:border-primary/40 hover:bg-muted/30"
      )}
    >
      <div className="mt-0.5 shrink-0">
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-primary animate-in zoom-in duration-300" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary/60 transition-colors" />
        )}
      </div>
      <span className={cn(
        "text-sm font-medium leading-tight transition-all",
        isCompleted ? "text-muted-foreground line-through opacity-70" : "text-foreground"
      )}>
        {title}
      </span>
    </div>
  );
};
