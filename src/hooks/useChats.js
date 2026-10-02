import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'novachat_sessions';
let nextId = Date.now();

const createChat = () => ({
  id: ++nextId,
  title: 'New chat',
  messages: [],
  createdAt: new Date().toISOString(),
});

/** Multi-conversation state persisted to localStorage */
export function useChats() {
  const [chats, setChats] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {
      /* corrupted storage — start fresh */
    }
    return [createChat()];
  });
  const [activeId, setActiveId] = useState(() => chats[0].id);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  }, [chats]);

  const active = chats.find((c) => c.id === activeId) || chats[0];

  const updateActive = useCallback(
    (updater) =>
      setChats((prev) => prev.map((c) => (c.id === activeId ? updater(c) : c))),
    [activeId]
  );

  const newChat = () => {
    const chat = createChat();
    setChats((prev) => [chat, ...prev]);
    setActiveId(chat.id);
  };

  const deleteChat = (id) =>
    setChats((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        const fresh = createChat();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(remaining[0].id);
      return remaining;
    });

  const appendMessage = (msg) =>
    updateActive((c) => ({
      ...c,
      title:
        c.messages.length === 0 && msg.role === 'user'
          ? msg.content.slice(0, 42) + (msg.content.length > 42 ? '…' : '')
          : c.title,
      messages: [...c.messages, msg],
    }));

  const appendToLast = (delta) =>
    updateActive((c) => {
      const messages = [...c.messages];
      const last = messages[messages.length - 1];
      if (last?.role === 'assistant' && last.streaming) {
        messages[messages.length - 1] = { ...last, content: last.content + delta };
      }
      return { ...c, messages };
    });

  const finalizeLast = (errorMsg) =>
    updateActive((c) => {
      const messages = [...c.messages];
      const last = messages[messages.length - 1];
      if (last?.role === 'assistant' && last.streaming) {
        messages[messages.length - 1] = {
          ...last,
          streaming: false,
          error: errorMsg || last.error,
        };
      }
      return { ...c, messages };
    });

  return {
    chats,
    active,
    activeId,
    setActiveId,
    newChat,
    deleteChat,
    appendMessage,
    appendToLast,
    finalizeLast,
  };
}
