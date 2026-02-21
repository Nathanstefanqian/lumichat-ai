import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Send, Bot, User, Menu, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamChat } from '../api/stream-chat';
import { generateAiTitle } from '../api/generate-title';
import { getConversations } from '../api/get-conversations';
import { createConversation } from '../api/create-conversation';
import { getMessages } from '../api/get-messages';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chat';
import { ConversationList } from './conversation-list';

export function ChatView() {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore(
    (state) => state.activeConversationId,
  );
  const setConversations = useChatStore((state) => state.setConversations);
  const mergeConversations = useChatStore((state) => state.mergeConversations);
  const upsertConversation = useChatStore((state) => state.upsertConversation);
  const setActiveConversationId = useChatStore(
    (state) => state.setActiveConversationId,
  );
  const setMessages = useChatStore((state) => state.setMessages);
  const switchConversation = useChatStore((state) => state.switchConversation);
  const addMessage = useChatStore((state) => state.addMessage);
  const appendMessage = useChatStore((state) => state.appendMessage);
  const setMessageContent = useChatStore((state) => state.setMessageContent);
  const setMessageStatus = useChatStore((state) => state.setMessageStatus);
  const setConversationTitle = useChatStore(
    (state) => state.setConversationTitle,
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const convos = await getConversations();
        // 如果本地没有对话，直接设置；如果有，则合并
        if (conversations.length === 0) {
          setConversations(convos);
        } else {
          mergeConversations(convos);
        }

        // 如果有选中的对话，加载其消息
        // 或者如果没有选中的对话且有列表，默认选中第一个并加载消息
        let targetId = activeConversationId;
        if (!targetId && convos.length > 0) {
          targetId = convos[0].id;
          setActiveConversationId(targetId);
        }

        if (targetId) {
          const msgs = await getMessages(targetId);
          setMessages(targetId, msgs);
        }
      } catch (error) {
        console.error('Failed to load chat data', error);
      }
    };
    loadData();
  }, []); // 仅在挂载时执行一次

  const activeConversation = useMemo(
    () =>
      conversations.find((conv) => conv.id === activeConversationId) || null,
    [conversations, activeConversationId],
  );

  // 移除切换对话时从服务器加载历史消息的逻辑
  /*
  useEffect(() => {
    // ... removed fetchMessages logic
  }, [activeConversationId, setMessages]);
  */

  const canSend = useMemo(() => input.trim().length > 0 && !isStreaming, [
    input,
    isStreaming,
  ]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [activeConversation?.messages]);

  const updateAssistant = (id: string, chunk: string) => {
    if (!activeConversationId) {
      return;
    }
    appendMessage(activeConversationId, id, chunk);
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || isStreaming) {
      return;
    }
    let currentConversationId = activeConversationId;
    if (!currentConversationId) {
      try {
        const newConvo = await createConversation();
        upsertConversation(newConvo);
        setActiveConversationId(newConvo.id);
        currentConversationId = newConvo.id;
      } catch (error) {
        console.error('Failed to create conversation', error);
        // Fallback to local
        const id = Date.now().toString();
        upsertConversation({
          id,
          title: 'AI 对话',
          createdAt: Date.now(),
          messages: [],
        });
        setActiveConversationId(id);
        currentConversationId = id;
      }
    }

    const userMessageId = Date.now().toString();
    const assistantId = (Date.now() + 1).toString();

    // 立即添加到本地显示
    addMessage(currentConversationId, {
      id: userMessageId,
      role: 'user',
      content,
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

    setInput('');
    setIsStreaming(true);
    const controller = new AbortController();
    controllerRef.current = controller;

    // 只有在发送第一条消息时才生成标题
    const conversation = conversations.find((c) => c.id === currentConversationId);
    const isFirstMessage = !conversation || conversation.messages.length <= 1;

    try {
      // Use original streamChat signature
      await streamChat(
        content,
        currentConversationId,
        () => {},
        (chunk) => {
          updateAssistant(assistantId, chunk);
        },
        controller.signal,
      );
      
      setMessageStatus(currentConversationId, userMessageId, 'synced');
      setMessageStatus(currentConversationId, assistantId, 'synced');
      
      // 生成标题
      if (isFirstMessage) {
        generateAiTitle(content, currentConversationId).then((result) => {
          if (result?.title) {
            setConversationTitle(currentConversationId!, result.title);
          }
        }).catch(() => {});
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Stream chat error:', error);
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
      event.preventDefault();
      handleSend();
    }
  };

  const stopStreaming = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setIsStreaming(false);
  };

  const handleNewConversation = async () => {
    stopStreaming();
    // 检查是否已有空的对话
    const emptyConversation = conversations.find(
      (c) => c.messages.length === 0,
    );
    if (emptyConversation) {
      setActiveConversationId(emptyConversation.id);
      return;
    }

    try {
      const newConvo = await createConversation();
      upsertConversation(newConvo);
      setActiveConversationId(newConvo.id);
    } catch (error) {
      console.error('Failed to create conversation', error);
      // Fallback to local
      const id = Date.now().toString();
      upsertConversation({
        id,
        title: 'AI 对话',
        createdAt: Date.now(),
        messages: [],
      });
      setActiveConversationId(id);
    }
  };

  const handleSwitchConversation = async (id: string) => {
    stopStreaming();
    switchConversation(id);
    // 如果对话内容为空，尝试从服务器加载
    const targetConvo = conversations.find(c => c.id === id);
    if (targetConvo && targetConvo.messages.length === 0) {
      try {
        const msgs = await getMessages(id);
        setMessages(id, msgs);
      } catch (error) {
        console.error('Failed to load messages', error);
      }
    }
  };

  return (
    <div className="flex-1 p-3 md:p-5 theme-muted h-screen overflow-hidden relative">
      <div className="w-full h-full flex flex-col">
        <div className="bg-card text-card-foreground rounded-3xl shadow-sm border border-border flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:w-64 border-r border-border p-4 flex-col min-h-0">
              <ConversationList
                onSelect={handleSwitchConversation}
                onNew={handleNewConversation}
              />
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              {/* Mobile Header */}
              <div className="md:hidden flex items-center p-3 border-b border-border">
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

              <div
                ref={listRef}
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
                      className={cn(
                        'flex items-start gap-3',
                        message.role === 'user'
                          ? 'justify-end'
                          : 'justify-start',
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                          <Bot className="w-5 h-5 text-blue-600" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                          message.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-gray-50 text-gray-700 rounded-bl-md',
                        )}
                      >
                        {message.role === 'assistant' ? (
                          message.content ? (
                            <div className="markdown-body">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <span className="typing-dots" aria-label="typing">
                              <span />
                            </span>
                          )
                        ) : (
                          <span className="whitespace-pre-wrap">
                            {message.content}
                          </span>
                        )}
                      </div>
                      {message.role === 'user' && (
                        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-purple-600" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-border p-4">
                <div className="flex items-end gap-3">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入你的问题，Enter 发送，Shift+Enter 换行"
                    className="flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                    rows={2}
                    disabled={isStreaming}
                  />
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
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="relative w-64 h-full bg-background border-r border-border shadow-xl transform transition-transform duration-300 ease-in-out p-4 flex flex-col">
             <div className="flex justify-end mb-2">
                <button onClick={() => setIsDrawerOpen(false)} className="p-1 hover:bg-muted rounded-full">
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
               className="flex-1"
             />
          </div>
        </div>
      )}
    </div>
  );
}
