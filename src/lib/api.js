/**
 * Streams a chat completion from our Express SSE proxy.
 * Yields every text delta as it arrives; resolves when the stream ends.
 */
export async function streamChat(messages, { onDelta, signal } = {}) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data.error) message = data.error;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    for (const line of decoder.decode(value, { stream: true }).split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') return full;

      try {
        const json = JSON.parse(payload);
        if (json.error) throw new Error(json.error);
        if (json.content) {
          full += json.content;
          onDelta?.(json.content, full);
        }
      } catch (err) {
        if (err.message && !err.message.startsWith('Unexpected')) throw err;
      }
    }
  }
  return full;
}
