export async function streamChat(
  message: string,
  conversationId: string | undefined,
  enableThinking: boolean,
  enableSearch: boolean,
  temperature: number,
  onMeta: (conversationId: string) => void,
  onChunk: (chunk: string) => void,
  onThinking: (thinking: string) => void,
  signal?: AbortSignal,
) {
  const token = localStorage.getItem('auth-storage');
  const parsed = token ? JSON.parse(token) : null;
  const authToken = parsed?.state?.token;
  const response = await fetch('/api/ai/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({ message, conversationId, enableThinking, enableSearch, temperature }),
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
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';
    for (const part of parts) {
      const lines = part.split('\n');
      let eventType = 'message';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7);
          continue;
        }
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }
          if (eventType === 'meta') {
            onMeta(data);
          } else if (eventType === 'error') {
            throw new Error(data);
          } else if (eventType === 'thinking') {
            onThinking(data.replace(/\\n/g, '\n'));
          } else {
            onChunk(data.replace(/\\n/g, '\n'));
          }
        }
      }
    }
  }
}
