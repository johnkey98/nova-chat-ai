# 🤖 NovaChat — Streaming AI Chat Assistant

![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/Node-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)

NovaChat is a full ChatGPT-style interface you can run on your own machine: a React UI with **token-by-token streaming** (Server-Sent Events), **rendered Markdown answers** (code blocks, tables, lists — all sanitized with DOMPurify), a **multi-conversation sidebar** persisted to `localStorage`, and a **stop button** that aborts generation mid-stream.

The Express backend is a thin, provider-agnostic proxy: it talks to **any OpenAI-compatible API** — OpenAI, OpenRouter, Groq, Together, or a local LLM gateway — configured entirely via environment variables. Your API key never reaches the browser; the frontend only ever sees the streamed tokens.

<!-- 📸 Add screenshots here, e.g.: ![NovaChat](screenshots/chat.png) -->

## ✨ Features

- **Real-time streaming** — SSE proxy streams model deltas to the browser the moment they arrive, with a blinking cursor.
- **Markdown rendering** — `marked` + `DOMPurify` for beautiful, XSS-safe answers (code blocks, tables, quotes).
- **Multi-chat workspace** — create/switch/delete conversations, auto-titled from your first message, persisted locally.
- **Stop generation** — aborts the fetch and marks the message gracefully.
- **Provider-agnostic server** — swap providers with two env vars (`OPENAI_BASE_URL`, `OPENAI_MODEL`).
- **Input hardening** — message length caps, role/content validation, structured error events.

## 🧱 Tech Stack

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| Frontend   | React 18 + Vite                   |
| Styling    | Tailwind CSS 3                    |
| Markdown   | marked + DOMPurify                |
| Backend    | Node.js 18+ (native fetch + SSE)  |
| Provider   | Any OpenAI-compatible chat API    |

## 🚀 Getting Started

```bash
git clone https://github.com/johnkey98/nova-chat-ai.git
cd nova-chat-ai
npm install

# configure the AI provider
cp .env.example .env
# → edit .env and set OPENAI_API_KEY (and optionally BASE_URL / MODEL)

npm run dev
# → API on :4000, UI on http://localhost:5173
```

> Works out of the box with OpenAI (`gpt-4o-mini` by default), or point `OPENAI_BASE_URL` at OpenRouter / Groq / Ollama's OpenAI-compatible endpoint.

### Production

```bash
npm run build && npm start   # one Express process serves UI + API on :4000
```

## ⚙️ Environment Variables

| Variable          | Default                       | Description                              |
| ----------------- | ----------------------------- | ---------------------------------------- |
| `PORT`            | `4000`                        | Server port                              |
| `OPENAI_API_KEY`  | — (required)                  | API key, stays server-side only          |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1`   | Any OpenAI-compatible base URL           |
| `OPENAI_MODEL`    | `gpt-4o-mini`                 | Model id                                 |
| `MAX_MESSAGE_CHARS` | `8000`                      | Per-message length cap                   |

## 📂 Project Structure

```
nova-chat-ai/
├── server/index.js          # SSE streaming proxy + health + SPA serving
├── src/
│   ├── App.jsx              # Layout, send/stop orchestration
│   ├── lib/api.js           # streamChat() — SSE client
│   ├── hooks/useChats.js    # Multi-conversation state + localStorage
│   ├── components/
│   │   ├── Sidebar.jsx      # Chat list, new/delete
│   │   ├── Message.jsx      # Markdown bubble + streaming cursor
│   │   └── ChatInput.jsx    # Textarea, Enter/Shift+Enter, stop button
│   └── index.css            # Tailwind + .md typography styles
└── .env.example
```

## 🔒 Security Notes

- The API key is read **only** on the server — the browser talks to `/api/chat` with no credentials.
- All model output is sanitized with DOMPurify before injection via `dangerouslySetInnerHTML`.
- Message payloads are validated (roles whitelisted, content length capped) before proxying.

## 🗺 Roadmap

- [ ] System-prompt editor per conversation
- [ ] Token usage counter
- [ ] Export chat as Markdown
- [ ] Voice input (Web Speech API)

## 📄 License

[MIT](LICENSE) © [John Key](https://github.com/johnkey98)
