export async function streamChat(
  message: string,
  conversationId: string | undefined,
  enableThinking: boolean,
  enableSearch: boolean,
  temperature: number,
  onMeta: (conversationId: string) => void,
  onChunk: (chunk: string) => void,
  onThinking: (thinking: string) => void,
  model?: string,
  fileUrl?: string,
  signal?: AbortSignal,
) {
  const token = localStorage.getItem('auth-storage');
  const parsed = token ? JSON.parse(token) : null;
  const authToken = parsed?.state?.token;

  const baseUrl = import.meta.env.VITE_API_URL || '/api';
  const url = `${baseUrl}/ai/chat/stream`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({
      message,
      conversationId,
      enableThinking,
      enableSearch,
      temperature,
      model,
      fileUrl,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error('请求失败');
  }

  if (!response.body) {
    throw new Error('流式响应不可用');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';

    for (const part of parts) {
      if (!part.startsWith('data: ')) continue;
      const dataStr = part.slice(6);
      if (dataStr === '[DONE]') return;

      try {
        const data = JSON.parse(dataStr);
        if (data.type === 'meta') {
          onMeta(data.conversationId);
        } else if (data.type === 'chunk') {
          onChunk(data.content);
        } else if (data.type === 'thinking') {
          onThinking(data.content);
        } else if (data.type === 'error') {
          throw new Error(data.message || '未知错误');
        }
      } catch (e) {
        console.error('解析流数据失败:', e, dataStr);
      }
    }
  }
}
