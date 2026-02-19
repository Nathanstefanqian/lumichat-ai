import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Send, Bot, User, Plus, MessageCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamChat } from '../api/stream-chat';
import { generateAiTitle } from '../api/generate-title';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chat';
import {
  createAiConversation,
  fetchConversations,
  fetchMessages,
  type ChatMessage as ChatMessageResponse,
} from '@/features/chat/api/chat';

export function ChatView() {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore(
    (state) => state.activeConversationId,
  );
  const setConversations = useChatStore((state) => state.setConversations);
  const upsertConversation = useChatStore((state) => state.upsertConversation);
  const setActiveConversationId = useChatStore(
    (state) => state.setActiveConversationId,
  );
  const setMessages = useChatStore((state) => state.setMessages);
  const switchConversation = useChatStore((state) => state.switchConversation);
  const addMessage = useChatStore((state) => state.addMessage);
  const appendMessage = useChatStore((state) => state.appendMessage);
  const setMessageContent = useChatStore((state) => state.setMessageContent);
  const setConversationTitle = useChatStore(
    (state) => state.setConversationTitle,
  );

  useEffect(() => {
    const loadConversations = async () => {
      const list = await fetchConversations('ai');
      const existing = useChatStore.getState().conversations;
      const currentActive = useChatStore.getState().activeConversationId;
      const mapped = list.map((conv) => ({
        id: conv._id,
        title: conv.title || 'AI 对话',
        createdAt: conv.lastMessageAt
          ? new Date(conv.lastMessageAt).getTime()
          : Date.now(),
        messages:
          existing.find((item) => item.id === conv._id)?.messages || [],
      }));
      setConversations(mapped);
      if (mapped.length > 0) {
        const nextId =
          mapped.find((item) => item.id === currentActive)?.id ||
          mapped[0].id;
        setActiveConversationId(nextId);
      } else {
        const created = await createAiConversation();
        upsertConversation({
          id: created._id,
          title: created.title || 'AI 对话',
          createdAt: Date.now(),
          messages: [],
        });
        setActiveConversationId(created._id);
      }
    };
    loadConversations().catch(() => {
      setConversations([]);
      setActiveConversationId(null);
    });
  }, [setActiveConversationId, setConversations, upsertConversation]);

  const activeConversation = useMemo(
    () =>
      conversations.find((conv) => conv.id === activeConversationId) || null,
    [conversations, activeConversationId],
  );

  useEffect(() => {
    if (!activeConversationId) {
      return;
    }
    if (!/^[0-9a-fA-F]{24}$/.test(activeConversationId)) {
      return;
    }
    if (isStreaming) {
      return;
    }
    const loadMessages = async () => {
      const list = await fetchMessages(activeConversationId);
      const mapped = list.map((item: ChatMessageResponse) => ({
        id: item._id,
        role: item.role,
        content: item.content,
        createdAt: new Date(item.createdAt).getTime(),
      }));
      if (mapped.length === 0 && activeConversation?.messages.length) {
        return;
      }
      setMessages(activeConversationId, mapped);
    };
    loadMessages().catch(() => {});
  }, [activeConversationId, activeConversation?.messages.length, isStreaming, setMessages]);

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
      const created = await createAiConversation();
      upsertConversation({
        id: created._id,
        title: created.title || 'AI 对话',
        createdAt: Date.now(),
        messages: [],
      });
      setActiveConversationId(created._id);
      currentConversationId = created._id;
    }
    const userMessageId = `user-${Date.now()}`;
    const assistantId = `assistant-${Date.now()}`;
    addMessage(currentConversationId, {
      id: userMessageId,
      role: 'user',
      content,
      createdAt: Date.now(),
    });
    addMessage(currentConversationId, {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    });
    const shouldGenerateTitle = !activeConversation || activeConversation.messages.length === 0;
    if (shouldGenerateTitle) {
      setConversationTitle(
        currentConversationId,
        content.slice(0, 20) || '新的对话',
      );
      generateAiTitle(content, currentConversationId)
        .then((result) => {
          if (result?.title) {
            setConversationTitle(currentConversationId, result.title);
          }
        })
        .catch(() => {});
    }
    setInput('');
    setIsStreaming(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await streamChat(
        content,
        currentConversationId,
        (conversationId) => {
          if (!conversationId) {
            return;
          }
          upsertConversation({
            id: conversationId,
            title: 'AI 对话',
            createdAt: Date.now(),
            messages: [],
          });
          setActiveConversationId(conversationId);
        },
        (chunk) => {
          updateAssistant(assistantId, chunk);
        },
        controller.signal,
      );
    } catch {
      if (currentConversationId) {
        setMessageContent(
          currentConversationId,
          assistantId,
          '\n\n请求失败，请稍后重试。',
        );
      }
    } finally {
      if (
        currentConversationId &&
        /^[0-9a-fA-F]{24}$/.test(currentConversationId)
      ) {
        fetchMessages(currentConversationId)
          .then((list) => {
            const mapped = list.map((item: ChatMessageResponse) => ({
              id: item._id,
              role: item.role,
              content: item.content,
              createdAt: new Date(item.createdAt).getTime(),
            }));
            if (mapped.length > 0) {
              setMessages(currentConversationId, mapped);
            }
          })
          .catch(() => {});
      }
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

  const handleNewConversation = () => {
    stopStreaming();
    createAiConversation()
      .then((conversation) => {
        upsertConversation({
          id: conversation._id,
          title: conversation.title || 'AI 对话',
          createdAt: Date.now(),
          messages: [],
        });
        setActiveConversationId(conversation._id);
      })
      .catch(() => {
        setActiveConversationId(null);
      });
  };

  const handleSwitchConversation = (id: string) => {
    stopStreaming();
    switchConversation(id);
  };

  return (
    <div className="flex-1 p-3 md:p-5 theme-muted h-screen overflow-hidden">
      <div className="w-full h-full flex flex-col">
        <div className="bg-card text-card-foreground rounded-3xl shadow-sm border border-border flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 flex flex-col md:flex-row">
            <div className="md:w-64 border-b md:border-b-0 md:border-r border-border p-4 space-y-3 flex flex-col min-h-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">对话列表</span>
                <button
                  onClick={handleNewConversation}
                  className="h-8 w-8 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 flex items-center justify-center transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 flex-1 min-h-0 overflow-y-auto scrollbar-hidden pr-1">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSwitchConversation(conv.id)}
                    className={cn(
                      'w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition',
                      conv.id === activeConversationId
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-muted text-muted-foreground',
                    )}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="truncate">{conv.title}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <div
                ref={listRef}
                className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 scrollbar-hidden"
              >
                {!activeConversation || activeConversation.messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-16 space-y-4">
                    <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/60" />
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
    </div>
  );
}
