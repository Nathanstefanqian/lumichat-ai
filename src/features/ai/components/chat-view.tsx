import { useEffect, useMemo, useRef, useState, Fragment } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  Menu,
  X,
  BrainCircuit,
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
  Code,
  BarChart,
  MessageSquare,
  Languages,
  PenTool,
  Image,
  Eye,
  Zap,
  Clock,
  Timer,
  Settings2,
  Sliders,
  Loader2,
} from 'lucide-react';

const TEMPERATURE_MODES = [
  { label: '代码生成/数学解题', value: 0.0, icon: Code, color: 'text-blue-500' },
  { label: '数据抽取/分析', value: 1.0, icon: BarChart, color: 'text-green-500' },
  { label: '通用对话', value: 1.3, icon: MessageSquare, color: 'text-purple-500' },
  { label: '翻译', value: 1.3, icon: Languages, color: 'text-orange-500' },
  { label: '创意类写作/诗歌创作', value: 1.5, icon: PenTool, color: 'text-pink-500' },
  { label: '自定义温度', value: 0.7, icon: Settings2, color: 'text-indigo-500', isCustom: true },
];

const MODEL_MODES = [
  { name: 'DeepSeek-Chat', value: 'deepseek-chat', icon: Bot, desc: '通用智能对话' },
  { name: 'DeepSeek-Reasoner', value: 'deepseek-reasoner', icon: Sparkles, desc: '强化推理 (思考模型)' },
  { name: 'Doubao-Seed-2.0-pro', value: 'doubao-seed-2.0-pro', icon: BrainCircuit, desc: '火山方舟旗舰 (Coding Plan)' },
  { name: 'Doubao-Seed-Code', value: 'doubao-seed-code', icon: Code, desc: '豆包编程模型 (Coding Plan)' },
  { name: 'Kimi-K2.5', value: 'kimi-k2.5', icon: Zap, desc: '月之暗面最新版 (Coding Plan)' },
  { name: 'GLM-4.7', value: 'glm-4.7', icon: MessageSquare, desc: '智谱旗舰模型 (Coding Plan)' },
  { name: 'DeepSeek-V3.2', value: 'deepseek-v3.2', icon: Bot, desc: '深度求索 V3.2 (Coding Plan)' },
  { name: 'Doubao-Seed-2.0-lite', value: 'doubao-seed-2.0-lite', icon: Zap, desc: '轻量高性能 (Coding Plan)' },
  { name: 'Qwen 3.5 (硅基流动)', value: 'Qwen/Qwen3.5-397B-A17B', icon: BrainCircuit, desc: '通义千问最新旗舰 MoE' },
  { name: 'MiniMax M2.5', value: 'minimax-m2.5', icon: Zap, desc: '高性能代码 & 逻辑专家 (Coding Plan)' },
  { name: 'Qwen-VL (视觉)', value: 'Qwen/Qwen2.5-VL-72B-Instruct', icon: Eye, desc: '视觉理解 & 识图回答' },
];

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function OpacityText({ content }: { content: string }) {
  // 将内容拆分为字符数组，包括空格
  const chars = Array.from(content);
  return (
    <span className="whitespace-pre-wrap break-words text-left">
      {chars.map((char, index) => (
        <span
          key={index}
          className="char-fade"
          style={{ animationDelay: `${index * 0.03}s` }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

function RealtimeTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);
    return () => clearInterval(timer);
  }, [startTime]);

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-primary/50 font-medium animate-pulse">
      <Timer className="w-3 h-3" />
      <span>正在思考... {(elapsed / 1000).toFixed(1)}s</span>
    </div>
  );
}

import { streamChat } from '../api/stream-chat';
import { generateAiTitle } from '../api/generate-title';
import { createAiConversation } from '../api/create-conversation';
import { deleteConversation } from '../api/delete-conversation';
import { getAiMessages } from '../api/get-messages';
import { uploadMedia } from '../../tools/api/media';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import { ConversationList } from './conversation-list';
import { formatMessageTime, shouldShowTimestamp } from '@/lib/date-utils';

export function ChatView() {
  const user = useAuthStore((state) => state.user);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [enableSearch, setEnableSearch] = useState(false);
  const [temperatureMode, setTemperatureMode] = useState(TEMPERATURE_MODES[2]); // Default: General Conversation
  const [selectedModel, setSelectedModel] = useState(MODEL_MODES[0]);
  const [showTempMenu, setShowTempMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [customTemp, setCustomTemp] = useState(0.7);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const listRef = useRef<HTMLDivElement | null>(null);
  const isAutoScrollRef = useRef(true);
  const controllerRef = useRef<AbortController | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

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

  const TypingDots = () => (
    <div className="flex items-center gap-1.5 px-1 py-1.5">
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-[pulse_1.5s_infinite_0s] opacity-30" />
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-[pulse_1.5s_infinite_0.3s] opacity-30" />
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-[pulse_1.5s_infinite_0.6s] opacity-30" />
    </div>
  );

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

  useEffect(() => {
    if (!activeConversationId || activeConversationId === 'new') return;

    // 强制每次切换都尝试从后端同步最新的消息，以防本地状态丢失或未同步
    setIsLoadingMessages(true);
    getAiMessages(activeConversationId)
      .then((messages) => {
        if (messages && messages.length > 0) {
          setMessages(activeConversationId, messages);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch messages', err);
      })
      .finally(() => {
        setIsLoadingMessages(false);
      });
  }, [activeConversationId, setMessages]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查是否是图片 (视觉模型支持多种图片格式)
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'];
    if (!supportedTypes.includes(file.type) && !file.type.startsWith('image/')) {
      alert('目前仅支持上传图片进行视觉分析');
      return;
    }

    setUploading(true);
    try {
      const res = await uploadMedia(file);
      if (res && res.url) {
        setUploadedFileUrl(res.url);
        // 如果上传了图片，自动切换到视觉模型
        if (selectedModel.value !== 'Qwen/Qwen2.5-VL-7B-Instruct') {
          setSelectedModel(MODEL_MODES[2]);
        }
      }
    } catch (err) {
      console.error('上传失败:', err);
      alert('上传失败，请稍后重试');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setUploading(true);
          try {
            const res = await uploadMedia(file);
            if (res && res.url) {
              setUploadedFileUrl(res.url);
              if (selectedModel.value !== 'Qwen/Qwen2.5-VL-72B-Instruct') {
                setSelectedModel(MODEL_MODES[2]);
              }
            }
          } catch (err) {
            console.error('粘贴上传失败:', err);
          } finally {
            setUploading(false);
          }
        }
      }
    }
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content && !uploadedFileUrl) return; // 允许只传图不传文字
    if (isStreaming) return;
    
    let currentConversationId = activeConversationId === 'new' ? null : activeConversationId;
    
    // 如果没有当前对话，尝试创建一个新的远程对话
    if (!currentConversationId) {
      // 立即设置 loading 状态
      setIsStreaming(true);
      
      let finalTitle = content ? content.slice(0, 20) : '图片对话';
      
      try {
        if (content) {
          console.log('Generating AI title for:', content);
          // Step 1: 尝试生成 AI 标题
          const titleRes = await generateAiTitle(content);
          if (titleRes && titleRes.title && titleRes.title.trim()) {
            finalTitle = titleRes.title.trim();
          }
        }
      } catch (error) {
        console.error('Title generation failed, using fallback:', finalTitle, error);
      }
      
      try {
        // Step 2: 创建对话
        const newConversation = await createAiConversation(finalTitle);
        upsertConversation(newConversation);
        setActiveConversationId(newConversation.id);
        currentConversationId = newConversation.id;
      } catch (error) {
        console.error('Failed to create conversation', error);
        setIsStreaming(false); 
        return;
      }
    }
    
    const currentImageUrl = uploadedFileUrl;
    setInput('');
    setUploadedFileUrl(null); // 清空已上传图片状态
    setIsStreaming(true);
    isAutoScrollRef.current = true;
    const userMessageId = `user-${Date.now()}`;
    const assistantId = `assistant-${Date.now()}`;
    
    // 添加用户消息
    addMessage(currentConversationId, {
      id: userMessageId,
      role: 'user',
      content,
      fileUrl: currentImageUrl || undefined,
      status: 'sending',
      createdAt: Date.now(),
    });
    
    // 添加 AI 消息占位符
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
          selectedModel.value === 'deepseek-reasoner',
          enableSearch,
          temperatureMode.isCustom ? customTemp : temperatureMode.value,
          (conversationId: string) => {
            if (!conversationId) return;
            const state = useChatStore.getState();
            const existing = state.conversations.find((item) => item.id === conversationId);
            if (!existing) {
              getAiMessages(conversationId).then(messages => {
                setMessages(conversationId, messages);
              });
            }
          },
          (chunk: string) => {
            appendMessage(currentConversationId!, assistantId, chunk);
          },
          (thinking: string) => {
            appendReasoning(currentConversationId!, assistantId, thinking);
          },
          selectedModel.value,
          currentImageUrl || undefined,
          controller.signal,
        );
        // 获取最新的消息状态（包含后端返回的耗时）
        getAiMessages(currentConversationId).then(messages => {
          setMessages(currentConversationId!, messages);
        });
        setMessageStatus(currentConversationId, assistantId, 'synced');
        setMessageStatus(currentConversationId, userMessageId, 'synced');
      } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Chat error:', error);
      setMessageContent(currentConversationId, assistantId, '抱歉，发生了错误，请稍后再试。');
      setMessageStatus(currentConversationId, assistantId, 'failed');
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
    <div className="flex-1 h-full overflow-hidden relative bg-card">
      <div className="w-full h-full flex flex-col">
        <div className="text-card-foreground flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 flex flex-col md:flex-row">
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
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/50 shadow-sm">
                    <Bot className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                  </div>
                  <span className="font-semibold truncate text-foreground">
                    {activeConversation?.title || 'AI 对话'}
                  </span>
                </div>
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
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/50 shadow-sm">
                    <Bot className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <h2 className="font-medium text-sm text-foreground/80">
                    {activeConversation?.title || '新对话'}
                  </h2>
                </div>
              </div>

              <div
                ref={listRef}
                onScroll={handleScroll}
                className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-4"
              >
                {isLoadingMessages ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500/50" />
                    <p className="text-sm">正在同步云端记录...</p>
                  </div>
                ) : !activeConversation || activeConversation.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                    <Sparkles className="w-12 h-12 text-muted-foreground/60" />
                    <p>开始一次新的对话...</p>
                  </div>
                ) : (
                  activeConversation.messages.map((message, index) => {
                    const prevMessage = activeConversation.messages[index - 1];
                    const showTimestamp = shouldShowTimestamp(message.createdAt, prevMessage?.createdAt);

                    return (
                    <Fragment key={message.id}>
                      {showTimestamp && (
                        <div className="flex justify-center my-4 select-none">
                          <span className="text-xs text-muted-foreground/60 bg-muted/40 px-2 py-0.5 rounded text-center">
                            {formatMessageTime(message.createdAt)}
                          </span>
                        </div>
                      )}
                    <div
                      id={`message-${message.id}`}
                      className={cn(
                        'flex w-full mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300',
                        message.role === 'user' ? 'justify-end' : 'justify-start',
                      )}
                    >
                      <div
                        className={cn(
                          'flex max-w-[85%] md:max-w-[75%] gap-3',
                          message.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                        )}
                      >
                        {/* Avatar */}
                        <div className="flex-none pt-1">
                          {message.role === 'user' ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-border bg-muted">
                              <img
                                src={user?.avatar || '/logo.jpg'}
                                alt="User"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm overflow-hidden">
                              <img src="/logo.jpg" alt="Lumi" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>

                        {/* Message Content Area */}
                        <div className={cn(
                          "flex flex-col gap-1.5",
                          message.role === 'user' ? "items-end" : "items-start"
                        )}>
                          {/* Image - Separated from bubble (Both user and assistant) */}
                          {message.fileUrl && (
                            <div className="mb-1">
                              <img 
                                src={message.fileUrl} 
                                alt="Content" 
                                className="rounded-2xl max-w-full max-h-80 object-cover cursor-pointer hover:opacity-95 transition-all shadow-sm border border-border/50"
                                onClick={() => window.open(message.fileUrl, '_blank')}
                              />
                            </div>
                          )}

                          {/* Text Bubble */}
                          <div
                            className={cn(
                              'relative px-4 py-2.5 rounded-2xl text-[14.5px] leading-relaxed shadow-sm transition-all',
                              message.role === 'user'
                                ? 'bg-[#f4f4f4] dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 rounded-tr-none'
                                : 'bg-white dark:bg-zinc-900 border border-border/50 text-gray-800 dark:text-zinc-200 rounded-tl-none',
                            )}
                          >
                            {message.role === 'assistant' ? (
                              <div className="prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800">
                                {message.reasoning_content && (
                                  <div className="mb-3 p-3 bg-muted/30 rounded-xl border-l-2 border-primary/30 italic text-muted-foreground text-xs">
                                    <div className="flex items-center gap-1.5 mb-1 not-italic font-medium text-primary/70">
                                      <BrainCircuit className="w-3 h-3" />
                                      <span>深度思考中...</span>
                                    </div>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {message.reasoning_content}
                                    </ReactMarkdown>
                                  </div>
                                )}
                                {message.content ? (
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {message.content}
                                  </ReactMarkdown>
                                ) : !message.fileUrl ? (
                                  <TypingDots />
                                ) : null}
                              </div>
                            ) : (
                              <OpacityText content={message.content} />
                            )}
                          </div>

                          {/* Time Display Outside Bubble (Only for Assistant) */}
                          {message.role === 'assistant' && (
                            <div className="px-1 flex items-center gap-2 min-h-[16px]">
                              {message.status === 'streaming' && (
                                <RealtimeTimer startTime={message.createdAt} />
                              )}
                              {message.duration && message.status !== 'streaming' && (
                                <div className="flex items-center gap-1.5 text-[10px] text-primary/60 font-bold select-none animate-in fade-in zoom-in duration-1000 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                                  <Clock className="w-2.5 h-2.5 text-primary/70" />
                                  <span>生成耗时: {(message.duration / 1000).toFixed(2)}s</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    </Fragment>
                  );})
                )}
              </div>

              {/* Input Area */}
              <div className="flex-none border-t border-border p-4 bg-card z-10 safe-area-bottom">
                <div className="flex items-end gap-3 mb-[env(safe-area-inset-bottom)]">
                  <div className="flex-1 flex flex-col gap-2">
                    {/* Image Preview - Moved above buttons */}
                    {uploadedFileUrl && (
                      <div className="px-1 animate-in fade-in slide-in-from-bottom-2">
                        <div className="relative w-20 h-20 group/preview bg-background border border-border rounded-xl shadow-sm p-1">
                          <img 
                            src={uploadedFileUrl} 
                            alt="Upload preview" 
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            onClick={() => setUploadedFileUrl(null)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm hover:bg-destructive/90 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 px-1 overflow-x-visible relative z-30">
                      {/* Model Selector */}
                      <div className="relative shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowModelMenu(!showModelMenu);
                            setShowTempMenu(false);
                          }}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors border whitespace-nowrap',
                            'bg-white dark:bg-zinc-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                          )}
                        >
                          <selectedModel.icon className="w-3 h-3 text-blue-500" />
                          {selectedModel.name}
                        </button>
                        
                        {showModelMenu && (
                          <>
                            <div className="fixed inset-0 z-[40]" onClick={() => setShowModelMenu(false)} />
                            <div className="absolute bottom-full mb-2 left-0 w-64 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl z-[50] py-1 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                              <div className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/50 border-b border-border mb-1">
                                选择 AI 模型
                              </div>
                              {MODEL_MODES.map((mode) => (
                                <button
                                  key={mode.value}
                                  onClick={() => {
                                    setSelectedModel(mode);
                                    setShowModelMenu(false);
                                  }}
                                  className={cn(
                                    "w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors",
                                    selectedModel.value === mode.value 
                                      ? "bg-gray-50 dark:bg-zinc-800 font-medium text-blue-600 dark:text-blue-400" 
                                      : "text-gray-600 dark:text-gray-400"
                                  )}
                                >
                                  <mode.icon className="w-3.5 h-3.5" />
                                  <div className="flex flex-col items-start">
                                    <span>{mode.name}</span>
                                    <span className="text-[10px] text-muted-foreground opacity-70">{mode.desc}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Temperature Selector */}
                      <div className="relative shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowTempMenu(!showTempMenu);
                            setShowModelMenu(false);
                          }}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors border whitespace-nowrap',
                            'bg-white dark:bg-zinc-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                          )}
                        >
                          <temperatureMode.icon className={cn("w-3 h-3", temperatureMode.color)} />
                          {temperatureMode.isCustom ? `温度: ${customTemp.toFixed(1)}` : temperatureMode.label}
                        </button>
                        
                        {showTempMenu && (
                          <>
                            <div className="fixed inset-0 z-[40]" onClick={() => setShowTempMenu(false)} />
                            <div className="absolute bottom-full mb-2 left-0 w-56 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl z-[50] py-1 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                              <div className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/50 border-b border-border mb-1">
                                选择参数模式
                              </div>
                              {TEMPERATURE_MODES.map((mode) => (
                                <button
                                  key={mode.label}
                                  onClick={() => {
                                    if (!mode.isCustom) {
                                      setTemperatureMode(mode);
                                      setShowTempMenu(false);
                                    } else {
                                      setTemperatureMode(mode);
                                    }
                                  }}
                                  className={cn(
                                    "w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors",
                                    (temperatureMode.label === mode.label)
                                      ? "bg-gray-50 dark:bg-zinc-800 font-medium text-blue-600 dark:text-blue-400" 
                                      : "text-gray-600 dark:text-gray-400"
                                  )}
                                >
                                  <mode.icon className={cn("w-3.5 h-3.5", mode.color)} />
                                  <div className="flex flex-col items-start gap-0.5">
                                    <span>{mode.label}</span>
                                    <span className="text-[10px] text-muted-foreground opacity-70">
                                      {mode.isCustom ? `当前: ${customTemp.toFixed(1)}` : `Temperature: ${mode.value.toFixed(1)}`}
                                    </span>
                                  </div>
                                </button>
                              ))}
                              
                              {temperatureMode.isCustom && (
                                <div className="px-3 py-3 border-t border-border mt-1 bg-muted/20">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-primary/70 flex items-center gap-1">
                                      <Sliders className="w-2.5 h-2.5" />
                                      调节温度
                                    </span>
                                    <span className="text-[10px] font-mono bg-primary/10 px-1.5 py-0.5 rounded text-primary">
                                      {customTemp.toFixed(1)}
                                    </span>
                                  </div>
                                  <input 
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.1"
                                    value={customTemp}
                                    onChange={(e) => setCustomTemp(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                  />
                                  <div className="flex justify-between mt-1 text-[8px] text-muted-foreground font-medium px-0.5">
                                    <span>严谨 (0.0)</span>
                                    <span>创造 (2.0)</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => setEnableSearch(!enableSearch)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors border whitespace-nowrap shrink-0',
                          enableSearch
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                            : 'bg-white dark:bg-zinc-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800',
                        )}
                      >
                        <Globe className="w-3 h-3" />
                        联网搜索
                      </button>
                    </div>

                    <div className="relative group/input">
                      <div className="flex items-center gap-2 bg-background border border-input rounded-2xl focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-all pr-2">
                        <textarea
                          value={input}
                          onChange={(event) => setInput(event.target.value)}
                          onKeyDown={handleKeyDown}
                          onPaste={handlePaste}
                          placeholder={uploading ? "图片上传中..." : "和我说话吧~"}
                          className="flex-1 resize-none bg-transparent px-4 py-3 text-[13px] md:text-sm focus:outline-none min-h-[48px]"
                          rows={Math.min(5, Math.max(1, input.split('\n').length))}
                          disabled={isStreaming || uploading}
                        />
                        <div className="flex items-center gap-1 self-end pb-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isStreaming || uploading}
                            className={cn(
                              "p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground",
                              uploadedFileUrl && "text-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            )}
                            title="上传图片"
                          >
                            {uploading ? (
                              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Image className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!canSend && !uploadedFileUrl}
                    className={cn(
                      'h-12 w-12 rounded-2xl flex items-center justify-center transition shrink-0 mb-0.5',
                      (canSend || uploadedFileUrl) && !isStreaming
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed',
                    )}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                  {isStreaming && (
                    <button
                      onClick={stopStreaming}
                      className="h-12 px-4 rounded-2xl bg-muted text-muted-foreground hover:bg-muted/80 transition shrink-0 mb-0.5"
                    >
                      停止
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Quick Navigation */}
              {userMessages.length > 0 && (
                <div className="absolute right-4 top-20 bottom-24 z-20 flex flex-col justify-center items-end pointer-events-none group/nav">
                  <div className="flex flex-col gap-1 items-end p-2 rounded-xl transition-all duration-300 max-h-full overflow-y-auto scrollbar-hidden group-hover/nav:bg-muted/80 group-hover/nav:pointer-events-auto">
                    {userMessages.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => scrollToMessage(m.id)}
                        className="pointer-events-auto cursor-pointer flex items-center gap-2 group/item h-4"
                      >
                        <span className="text-xs text-muted-foreground opacity-0 group-hover/nav:opacity-40 group-hover/item:!opacity-100 transition-opacity duration-300 whitespace-nowrap max-w-[200px] truncate text-right">
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
