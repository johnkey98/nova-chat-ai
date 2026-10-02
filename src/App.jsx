import { useEffect, useRef, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import ChatInput from './components/ChatInput.jsx';
import Message from './components/Message.jsx';
import { useChats } from './hooks/useChats.js';
import { streamChat } from './lib/api.js';

export default function App() {
  const {
    chats, active, activeId, setActiveId,
    newChat, deleteChat, appendMessage, appendToLast, finalizeLast,
  } = useChats();
  const [busy, setBusy] = useState(false);
  const abortRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active?.messages]);

  const send = async (text) => {
    if (busy) return;
    setBusy(true);
    appendMessage({ role: 'user', content: text });
    appendMessage({ role: 'assistant', content: '', streaming: true });

    const history = [...active.messages, { role: 'user', content: text }].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    abortRef.current = new AbortController();
    try {
      await streamChat(history, {
        onDelta: (delta) => appendToLast(delta),
        signal: abortRef.current.signal,
      });
      finalizeLast();
    } catch (err) {
      const aborted = err.name === 'AbortError';
      finalizeLast(aborted ? 'Generation stopped.' : err.message);
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  return (
    <div className="flex h-screen">
      <Sidebar
        chats={chats}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={newChat}
        onDelete={deleteChat}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-slate-800 px-6">
          <span className="text-sm font-semibold text-slate-300">{active.title}</span>
          <span className="text-xs text-slate-500">NovaChat v1.0 · streaming AI assistant</span>
        </header>

        <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto p-6">
          <div className="mx-auto max-w-3xl space-y-5">
            {active.messages.length === 0 && (
              <div className="mt-24 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-2xl font-black">
                  N
                </div>
                <h1 className="text-xl font-bold">How can I help you today?</h1>
                <p className="mt-1 text-sm text-slate-400">
                  Ask a question, paste code for review, or request a summary — answers stream in real time.
                </p>
              </div>
            )}
            {active.messages.map((m, i) => (
              <Message key={i} message={m} />
            ))}
            <div ref={endRef} />
          </div>
        </div>

        <ChatInput onSend={send} onStop={stop} busy={busy} />
      </div>
    </div>
  );
}
