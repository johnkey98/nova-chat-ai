import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

/** Render assistant/user message content as sanitized markdown */
export default function Message({ message }) {
  const isUser = message.role === 'user';

  const html = useMemo(() => {
    if (isUser) return null;
    return DOMPurify.sanitize(marked.parse(message.content || ''));
  }, [message.content, isUser]);

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          isUser ? 'bg-sky-600' : 'bg-gradient-to-br from-violet-500 to-indigo-600'
        }`}
      >
        {isUser ? 'You'[0] : 'N'}
      </div>

      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? 'rounded-tr-sm bg-sky-600/90'
            : `rounded-tl-sm bg-slate-800 ${message.error ? 'border border-red-500/50' : ''}`
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <>
            <div className="md" dangerouslySetInnerHTML={{ __html: html }} />
            {message.streaming && (
              <span className="inline-block h-4 w-2 animate-pulse rounded-sm bg-violet-400 align-middle" />
            )}
            {message.error && (
              <p className="mt-2 text-xs text-red-400">⚠ {message.error}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
