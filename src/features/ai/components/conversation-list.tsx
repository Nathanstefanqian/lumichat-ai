import { Plus, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chat';

interface ConversationListProps {
  onSelect: (id: string) => void;
  onNew: () => void;
  className?: string;
}

export function ConversationList({ onSelect, onNew, className }: ConversationListProps) {
  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore((state) => state.activeConversationId);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-sm font-semibold text-foreground">对话列表</span>
        <button
          onClick={onNew}
          className="h-8 w-8 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 flex items-center justify-center transition"
          aria-label="New conversation"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2 flex-1 min-h-0 overflow-y-auto scrollbar-hidden pr-1">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              'w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition',
              conv.id === activeConversationId
                ? 'bg-blue-50 text-blue-700'
                : 'hover:bg-muted text-muted-foreground',
            )}
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">{conv.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
