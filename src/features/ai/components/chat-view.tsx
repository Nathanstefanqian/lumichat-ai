import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Menu,
  X,
  BrainCircuit,
  Globe,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Code,
  BarChart,
  MessageSquare,
  Languages,
  PenTool,
} from 'lucide-react';

const TEMPERATURE_MODES = [
  { label: '代码生成/数学解题', value: 0.0, icon: Code, color: 'text-blue-500' },
  { label: '数据抽取/分析', value: 1.0, icon: BarChart, color: 'text-green-500' },
  { label: '通用对话', value: 1.3, icon: MessageSquare, color: 'text-purple-500' },
  { label: '翻译', value: 1.3, icon: Languages, color: 'text-orange-500' },
  { label: '创意类写作/诗歌创作', value: 1.5, icon: PenTool, color: 'text-pink-500' },
];

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamChat } from '../api/stream-chat';
import { generateAiTitle } from '../api/generate-title';
import { createAiConversation } from '../api/create-conversation';
import { deleteConversation } from '../api/delete-conversation';
import { getAiMessages } from '../api/get-messages';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import { ConversationList } from './conversation-list';

function ReasoningBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(true);
  if (!content) return null;
  return (
    <div className="border-l-2 border-purple-200 dark:border-purple-700/50 pl-4 py-2 my-2 bg-purple-50/30 dark:bg-purple-900/20 rounded-r-md">
      <div 
        className="flex items-center gap-2 cursor-pointer text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 text-xs font-medium mb-1 select-none"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <BrainCircuit className="w-3 h-3" />
        <span>深度思考过程</span>
      </div>
      {expanded && (
        <div className="text-gray-600 dark:text-gray-300 text-xs whitespace-pre-wrap font-mono leading-relaxed opacity-90">
          {content}
        </div>
      )}
    </div>
  );
}

export function ChatView() {
  const user = useAuthStore((state) => state.user);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [enableThinking, setEnableThinking] = useState(false);
  const [enableSearch, setEnableSearch] = useState(false);
  const [temperatureMode, setTemperatureMode] = useState(TEMPERATURE_MODES[2]); // Default: General Conversation
  const [showTempMenu, setShowTempMenu] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const listRef = useRef<HTMLDivElement | null>(null);
  const isAutoScrollRef = useRef(true);
  const controllerRef = useRef<AbortController | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore(
    (state) => state.activeConversationId,
  );
  // const setConversations = useChatStore((state) => state.setConversations); // Removed
  const upsertConversation = useChatStore((state) => state.upsertConversation);
  const setActiveConversationId = useChatStore(
    (state) => state.setActiveConversationId,
  );
  const setMessages = useChatStore((state) => state.setMessages);
  const switchConversation = useChatStore((state) => state.switchConversation);
  const addMessage = useChatStore((state) => state.addMessage);
  const appendMessage = useChatStore((state) => state.appendMessage);
  const appendReasoning = useChatStore((state) => state.appendReasoning);
  const setMessageContent = useChatStore((state) => state.setMessageContent);
  const setMessageStatus = useChatStore((state) => state.setMessageStatus);
  // const setConversationTitle = useChatStore(
  //   (state) => state.setConversationTitle,
  // );
  const removeConversation = useChatStore((state) => state.removeConversation);
  const clearAllConversations = useChatStore((state) => state.clearAllConversations);

  useEffect(() => {
    // 移除自动创建对话的逻辑
    // 如果没有对话，不做任何操作，让用户手动创建
    if (conversations.length > 0 && !activeConversationId) {
      // 如果有对话但未选中，默认选中第一个
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId, setActiveConversationId]);

  const activeConversation = useMemo(
    () =>
      conversations.find((conv) => conv.id === activeConversationId) || null,
    [conversations, activeConversationId],
  );

  const userMessages = useMemo(() => {
    return activeConversation?.messages.filter((m) => m.role === 'user') || [];
  }, [activeConversation?.messages]);

  // 当选中对话且消息为空时，尝试从服务器加载消息
  useEffect(() => {
    if (!activeConversationId) return;

    const conversation = conversations.find(c => c.id === activeConversationId);
    if (conversation && conversation.messages.length === 0) {
      getAiMessages(activeConversationId)
        .then((messages) => {
          if (messages.length > 0) {
            setMessages(activeConversationId, messages);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch messages', err);
        });
    }
  }, [activeConversationId, conversations, setMessages]);

  const canSend = useMemo(() => input.trim().length > 0 && !isStreaming, [
    input,
    isStreaming,
  ]);

  useEffect(() => {
    // 切换对话时，重置自动滚动，并立即滚动到底部
    isAutoScrollRef.current = true;
  }, [activeConversationId]);

  useEffect(() => {
    if (listRef.current && isAutoScrollRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [activeConversation?.messages]);

  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    isAutoScrollRef.current = isAtBottom;

    // Detect active message
    if (!activeConversation?.messages.length) return;
    
    const containerTop = listRef.current.getBoundingClientRect().top;
    const messages = activeConversation.messages;
    
    // Find the message that is most visible in the viewport
    let currentActiveId = null;
    
    for (const msg of messages) {
      const element = document.getElementById(`message-${msg.id}`);
      if (element) {
        const rect = element.getBoundingClientRect();
        // If top of element is near top of container (within 100px) or element spans the container
        if (rect.top >= containerTop - 50 && rect.top <= containerTop + clientHeight / 2) {
          currentActiveId = msg.id;
          break; 
        }
      }
    }
    
    if (currentActiveId && currentActiveId !== activeMessageId) {
       setActiveMessageId(currentActiveId);
    }
  };

  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const updateAssistant = (conversationId: string, messageId: string, chunk: string) => {
    appendMessage(conversationId, messageId, chunk);
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || isStreaming) {
      return;
    }
    let currentConversationId = activeConversationId === 'new' ? null : activeConversationId;
    
    // 如果没有当前对话，尝试创建一个新的远程对话
    if (!currentConversationId) {
      // 立即设置 loading 状态
      setIsStreaming(true);
      
      let finalTitle = content.slice(0, 20) || '新对话';
      
      try {
        console.log('Generating AI title for:', content);
        // Step 1: 尝试生成 AI 标题
        const titleRes = await generateAiTitle(content);
        if (titleRes && titleRes.title && titleRes.title.trim()) {
          finalTitle = titleRes.title.trim();
          console.log('AI Title generated:', finalTitle);
        } else {
          console.warn('AI Title empty, using default');
        }
      } catch (error) {
        console.error('Title generation failed, using fallback:', finalTitle, error);
        // 出错时保持使用 content slice
      }
      
      try {
        // Step 2: 创建对话
        console.log('Creating conversation with title:', finalTitle);
        const newConversation = await createAiConversation(finalTitle);
        
        // 双重检查：如果后端返回的标题是默认值，但我们发的是自定义值，强制更新本地
        if (newConversation.title === 'AI 对话' && finalTitle !== 'AI 对话') {
             newConversation.title = finalTitle;
        }

        upsertConversation(newConversation);
        setActiveConversationId(newConversation.id);
        currentConversationId = newConversation.id;
        
      } catch (error) {
        console.error('Failed to create conversation', error);
        setIsStreaming(false); 
        // 回退到本地创建
        const id = Date.now().toString();
        upsertConversation({
          id,
          title: finalTitle, // 使用我们计算出的标题
          createdAt: Date.now(),
          messages: [],
        });
        setActiveConversationId(id);
        currentConversationId = id;
      }
    }
    
    setInput('');
    setIsStreaming(true);
    isAutoScrollRef.current = true;
    const userMessageId = `user-${Date.now()}`;
    const assistantId = `assistant-${Date.now()}`;
    
    // 添加用户消息（状态：sending）
    addMessage(currentConversationId, {
      id: userMessageId,
      role: 'user',
      content,
      status: 'sending',
      createdAt: Date.now(),
    });
    
    // 添加 AI 消息占位符（状态：streaming）
    addMessage(currentConversationId, {
      id: assistantId,
      role: 'assistant',
      content: '',
      status: 'streaming',
      createdAt: Date.now(),
    });

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await streamChat(
        content,
        currentConversationId,
        enableThinking,
        enableSearch,
        temperatureMode.value,
        (conversationId) => {
          if (!conversationId) {
            return;
          }
          const state = useChatStore.getState();
          const existing = state.conversations.find(
            (item) => item.id === conversationId,
          );
          if (!existing) {
            upsertConversation({
              id: conversationId,
              title: 'AI 对话',
              createdAt: Date.now(),
              messages: [],
            });
          }
          if (state.activeConversationId !== conversationId) {
            setActiveConversationId(conversationId);
          }
        },
        (chunk) => {
          updateAssistant(currentConversationId, assistantId, chunk);
        },
        (thinking) => {
          appendReasoning(currentConversationId, assistantId, thinking);
        },
        controller.signal,
      );
      
      // 流式传输成功完成，标记消息为 synced
      if (currentConversationId) {
        setMessageStatus(currentConversationId, userMessageId, 'synced');
        setMessageStatus(currentConversationId, assistantId, 'synced');
        
        // 我们不再立即重新获取消息列表和对话列表，
        // 而是完全信任前端的状态（Optimistic UI），
        // 只有在用户刷新页面或重新进入时，才从服务器同步最新数据。
        // 这避免了服务器数据写入延迟导致的“消息消失”或“列表清空”问题。
      }
    } catch {
      // 流式传输失败
      if (currentConversationId) {
        setMessageStatus(currentConversationId, userMessageId, 'failed');
        setMessageStatus(currentConversationId, assistantId, 'failed');
        setMessageContent(
          currentConversationId,
          assistantId,
          '\n\n请求失败，请稍后重试。',
        );
      }
    } finally {
      setIsStreaming(false);
      controllerRef.current = null;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      // 检查是否正在进行输入法组合（中文输入等）
      if (event.nativeEvent.isComposing) {
        return;
      }
      event.preventDefault();
      handleSend();
    }
  };

  const stopStreaming = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setIsStreaming(false);
  };

  const handleNewConversation = () => {
    stopStreaming();
    setActiveConversationId('new');
  };

  const handleSwitchConversation = (id: string) => {
    stopStreaming();
    switchConversation(id);
    setActiveMessageId(null);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversation(id);
      removeConversation(id);
    } catch (error) {
      console.error('Failed to delete conversation', error);
      // Fallback: still remove from UI if it's just a network error on a stale ID?
      // Or maybe show error.
      // For now, let's assume if it fails, we don't remove it from UI to let user retry.
    }
  };

  const handleClearAllConversations = () => {
    // 清空前端所有对话
    clearAllConversations();
  };

  return (
    <div className="flex-1 overflow-hidden relative bg-card">
      <div className="w-full h-full flex flex-col">
        <div className="text-card-foreground flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <div
              className={cn(
                'hidden md:flex border-r border-border flex-col min-h-0 transition-all duration-300 ease-in-out',
                isSidebarOpen ? 'w-64 p-4' : 'w-0 p-0 overflow-hidden border-none',
              )}
            >
              <div
                className={cn(
                  'flex flex-col h-full w-56 transition-opacity duration-300',
                  isSidebarOpen ? 'opacity-100' : 'opacity-0 invisible',
                )}
              >
                <ConversationList
                  onSelect={handleSwitchConversation}
                  onNew={handleNewConversation}
                  onDelete={handleDeleteConversation}
                  onClearAll={handleClearAllConversations}
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              {/* Mobile Header */}
              <div className="md:hidden flex-none z-40 bg-card/95 backdrop-blur flex items-center p-3 h-14 border-b border-border">
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="mr-2 p-1 -ml-1 hover:bg-muted rounded-full"
                >
                  <Menu className="w-5 h-5 text-foreground" />
                </button>
                <span className="font-semibold truncate text-foreground">
                  {activeConversation?.title || '对话'}
                </span>
              </div>

              {/* Desktop Header */}
              <div className="hidden md:flex flex-none items-center justify-center p-4 border-b border-border bg-background/95 backdrop-blur z-10 relative h-14">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="absolute left-4 p-2 hover:bg-muted rounded-md text-muted-foreground transition-colors"
                  title={isSidebarOpen ? '收起侧边栏' : '展开侧边栏'}
                >
                  {isSidebarOpen ? (
                    <PanelLeftClose className="w-4 h-4" />
                  ) : (
                    <PanelLeftOpen className="w-4 h-4" />
                  )}
                </button>
                <h2 className="font-medium text-sm text-foreground/80">
                  {activeConversation?.title || '新对话'}
                </h2>
              </div>

              <div
                ref={listRef}
                onScroll={handleScroll}
                className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-hidden"
              >
                {!activeConversation || activeConversation.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                    <Sparkles className="w-12 h-12 text-muted-foreground/60" />
                    <p>开始一次新的对话...</p>
                  </div>
                ) : (
                  activeConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      id={`message-${message.id}`}
                      className={cn(
                        'flex items-start gap-3 scroll-mt-20',
                        message.role === 'user'
                          ? 'justify-end'
                          : 'justify-start',
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Bot className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                          message.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-gray-50 dark:bg-zinc-800/80 text-gray-700 dark:text-gray-100 rounded-bl-md',
                        )}
                      >
                        {message.role === 'assistant' ? (
                        <div className="flex flex-col gap-1 min-w-0">
                          {message.reasoning_content && (
                            <ReasoningBlock content={message.reasoning_content} />
                          )}
                          {message.content ? (
                            <div className="markdown-body">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <span className="typing-dots" aria-label="typing">
                              <span />
                              <span />
                              <span />
                            </span>
                          )}
                        </div>
                      ) : (
                          <span className="whitespace-pre-wrap">
                            {message.content}
                          </span>
                        )}
                      </div>
                      {message.role === 'user' && (
                        <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center overflow-hidden">
                          {user?.avatar ? (
                            <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Input Area */}
              <div className="flex-none border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-card z-10">
                <div className="flex items-end gap-3">
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-1">
                      <div className="relative">
                        <button
                          onClick={() => setShowTempMenu(!showTempMenu)}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                            'bg-white dark:bg-zinc-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                          )}
                          title={`当前模式: ${temperatureMode.label} (Temperature: ${temperatureMode.value})`}
                        >
                          <temperatureMode.icon className={cn("w-3.5 h-3.5", temperatureMode.color)} />
                          {temperatureMode.label}
                        </button>
                        
                        {showTempMenu && (
                          <>
                            <div 
                              className="fixed inset-0 z-30" 
                              onClick={() => setShowTempMenu(false)}
                            />
                            <div className="absolute bottom-full mb-2 left-0 w-56 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg z-40 py-1 overflow-hidden">
                              <div className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/50 border-b border-border mb-1">
                                选择对话模式
                              </div>
                              {TEMPERATURE_MODES.map((mode) => (
                                <button
                                  key={mode.label}
                                  onClick={() => {
                                    setTemperatureMode(mode);
                                    setShowTempMenu(false);
                                  }}
                                  className={cn(
                                    "w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors",
                                    temperatureMode.value === mode.value && temperatureMode.label === mode.label 
                                      ? "bg-gray-50 dark:bg-zinc-800 font-medium" 
                                      : "text-gray-600 dark:text-gray-400"
                                  )}
                                >
                                  <mode.icon className={cn("w-3.5 h-3.5", mode.color)} />
                                  <div className="flex flex-col items-start gap-0.5">
                                    <span>{mode.label}</span>
                                    <span className="text-[10px] text-muted-foreground opacity-70">Temperature: {mode.value.toFixed(1)}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => setEnableSearch(!enableSearch)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                          enableSearch
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                            : 'bg-white dark:bg-zinc-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800',
                        )}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        联网搜索
                      </button>
                      <button
                        onClick={() => setEnableThinking(!enableThinking)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                          enableThinking
                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800'
                            : 'bg-white dark:bg-zinc-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800',
                        )}
                      >
                        <BrainCircuit className="w-3.5 h-3.5" />
                        深度思考
                      </button>
                    </div>
                    <textarea
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="输入你的问题，Enter 发送，Shift+Enter 换行"
                      className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      rows={2}
                      disabled={isStreaming}
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!canSend}
                    className={cn(
                      'h-12 w-12 rounded-2xl flex items-center justify-center transition',
                      canSend
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed',
                    )}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                  {isStreaming && (
                    <button
                      onClick={stopStreaming}
                      className="h-12 px-4 rounded-2xl bg-muted text-muted-foreground hover:bg-muted/80 transition"
                    >
                      停止
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Quick Navigation */}
              {userMessages.length > 0 && (
                <div className="absolute right-4 top-20 bottom-24 z-20 flex flex-col justify-center items-end pointer-events-none">
                  <div className="pointer-events-auto flex flex-col gap-1 items-end p-2 rounded-xl hover:bg-muted/80 transition-all duration-300 group max-h-full overflow-y-auto scrollbar-hidden">
                    {userMessages.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => scrollToMessage(m.id)}
                        className="cursor-pointer flex items-center gap-2 group/item h-4"
                      >
                        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap max-w-[200px] truncate text-right">
                          {m.content}
                        </span>
                        <div
                          className={cn(
                            'w-1 rounded-full transition-all duration-300',
                            activeMessageId === m.id
                              ? 'bg-blue-500 h-4'
                              : 'bg-muted-foreground/30 group-hover/item:bg-muted-foreground h-1.5 w-1.5'
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Drawer Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 flex md:hidden transition-all duration-300',
          isDrawerOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none',
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setIsDrawerOpen(false)}
        />
        {/* Drawer Panel */}
        <div
          className={cn(
            'relative w-64 h-full bg-background border-r border-border shadow-xl p-4 flex flex-col transition-transform duration-300 ease-in-out',
            isDrawerOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1 hover:bg-muted rounded-full"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <ConversationList
            onSelect={(id) => {
              handleSwitchConversation(id);
              setIsDrawerOpen(false);
            }}
            onNew={() => {
              handleNewConversation();
              setIsDrawerOpen(false);
            }}
            onDelete={handleDeleteConversation}
            onClearAll={handleClearAllConversations}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}
