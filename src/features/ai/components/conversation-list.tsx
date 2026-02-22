import { Plus, MessageCircle, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chat';
import { getAiConversations } from '../api/get-conversations';
import { useState, useEffect } from 'react';

interface ConversationListProps {
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete?: (id: string) => void;
  onClearAll?: () => void;
  className?: string;
}

export function ConversationList({ onSelect, onNew, onDelete, onClearAll, className }: ConversationListProps) {
  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const setConversations = useChatStore((state) => state.setConversations);
  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const remoteConversations = await getAiConversations();
      setConversations(remoteConversations);
      
      // 如果当前选中的对话不在新的列表中，默认选中第一个
      if (activeConversationId && !remoteConversations.find(c => c.id === activeConversationId)) {
        if (remoteConversations.length > 0) {
          setActiveConversationId(remoteConversations[0].id);
        } else {
          setActiveConversationId(null);
        }
      }
    } catch (error) {
      console.error('Failed to sync conversations', error);
      alert('同步失败，请稍后重试');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    handleSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-sm font-semibold text-foreground">对话列表</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={cn(
              "h-8 w-8 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 flex items-center justify-center transition",
              isSyncing && "animate-spin"
            )}
            aria-label="Sync conversations"
            title="同步云端对话列表"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onNew}
            className="h-8 w-8 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 flex items-center justify-center transition"
            aria-label="New conversation"
            title="新建对话"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="space-y-2 flex-1 min-h-0 overflow-y-auto scrollbar-hidden pr-1">
        {conversations.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>暂无对话</p>
            <p className="text-xs mt-1">点击 + 创建新对话</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                'group w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition cursor-pointer',
                conv.id === activeConversationId
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-muted text-muted-foreground',
              )}
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span className="truncate flex-1">{conv.title}</span>
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('确定要删除这个对话吗？')) {
                      onDelete(conv.id);
                    }
                  }}
                  className={cn(
                    "p-1 rounded-md hover:bg-background/50 hover:text-red-500 transition-all",
                    "opacity-0 group-hover:opacity-100 focus:opacity-100",
                    conv.id === activeConversationId ? "opacity-100" : ""
                  )}
                  aria-label="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {onClearAll && conversations.length > 0 && (
        <div className="pt-2 mt-2 border-t border-border">
          <button
            onClick={() => {
              if (confirm('确定要清空所有对话历史吗？此操作不可恢复！')) {
                onClearAll();
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>清空所有对话</span>
          </button>
        </div>
      )}
    </div>
  );
}
