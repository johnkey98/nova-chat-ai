import { useState } from 'react';
import { SendHorizonal, Square } from 'lucide-react';

export default function ChatInput({ onSend, onStop, busy }) {
  const [value, setValue] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || busy) return;
    setValue('');
    onSend(text);
  };

  return (
    <form onSubmit={submit} className="border-t border-slate-800 bg-slate-900/60 p-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <textarea
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit(e);
            }
          }}
          placeholder="Ask anything… (Enter to send, Shift+Enter for a new line)"
          className="max-h-40 flex-1 resize-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm outline-none transition focus:border-violet-500"
        />
        {busy ? (
          <button
            type="button"
            onClick={onStop}
            className="rounded-xl bg-red-600 p-3 transition hover:bg-red-500"
            title="Stop generating"
          >
            <Square size={18} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!value.trim()}
            className="rounded-xl bg-violet-600 p-3 transition hover:bg-violet-500 disabled:opacity-40"
            title="Send"
          >
            <SendHorizonal size={18} />
          </button>
        )}
      </div>
    </form>
  );
}
