import { Plus, Trash2, MessageSquare } from 'lucide-react';

export default function Sidebar({ chats, activeId, onSelect, onNew, onDelete }) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900/60">
      <div className="flex items-center justify-between px-4 py-4">
        <span className="font-extrabold tracking-tight">
          Nova<span className="text-violet-400">Chat</span>
        </span>
        <button
          onClick={onNew}
          className="rounded-lg bg-violet-600 p-1.5 transition hover:bg-violet-500"
          title="New chat"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {chats.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition ${
              c.id === activeId ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare size={14} className="shrink-0" />
            <span className="flex-1 truncate">{c.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(c.id);
              }}
              className="hidden text-slate-500 hover:text-red-400 group-hover:block"
              title="Delete chat"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <p className="border-t border-slate-800 px-4 py-3 text-[11px] text-slate-500">
        Conversations are stored locally in your browser.
      </p>
    </aside>
  );
}
