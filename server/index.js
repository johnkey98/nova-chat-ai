import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

const {
  OPENAI_API_KEY = '',
  OPENAI_BASE_URL = 'https://api.openai.com/v1',
  OPENAI_MODEL = 'gpt-4o-mini',
  MAX_MESSAGE_CHARS = '8000',
} = process.env;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) =>
  res.json({
    status: 'ok',
    model: OPENAI_MODEL,
    keyConfigured: OPENAI_API_KEY.length > 0,
    baseUrl: OPENAI_BASE_URL,
  })
)

/**
 * POST /api/chat
 * Body: { messages: [{ role: 'user'|'assistant'|'system', content: string }] }
 * Streams the assistant reply back as Server-Sent Events (SSE) —
 * the client receives tokens the moment the upstream model produces them.
 */
app.post('/api/chat', async (req, res) => {
  const { messages = [] } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages[] is required' });
  }
  if (messages.some((m) => !m.role || typeof m.content !== 'string' || m.content.length > +MAX_MESSAGE_CHARS)) {
    return res.status(422).json({ error: `Each message needs a role and content up to ${MAX_MESSAGE_CHARS} chars` });
  }
  if (!OPENAI_API_KEY) {
    return res.status(503).json({ error: 'OPENAI_API_KEY is not configured on the server. See .env.example' });
  }

  // SSE handshake
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const upstream = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        stream: true,
        messages: [
          {
            role: 'system',
            content: 'You are NovaChat, a helpful, precise AI assistant. Format answers in clean Markdown.',
          },
          ...messages.map(({ role, content }) => ({ role, content })),
        ],
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      res.write(`event: error\ndata: ${JSON.stringify({ error: `Upstream ${upstream.status}: ${text.slice(0, 300)}` })}\n\n`);
      return res.end();
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // OpenAI streams SSE lines like: data: {"choices":[{"delta":{"content":"…"}}]}
      for (const line of decoder.decode(value, { stream: true }).split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') {
          res.write('data: [DONE]\n\n');
          return res.end();
        }
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
        } catch {
          // keep-alive comments or partial frames — ignore
        }
      }
    }
    res.end();
  } catch (err) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// Client disconnect: abort upstream when the browser goes away
app.use((req, _res, next) => {
  req.on('close', () => req.body && null); // keep socket errors non-fatal
  next();
});

if (process.env.NODE_ENV === 'production') {
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const dist = path.join(__dirname, '..', 'dist');
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`🤖  NovaChat server on http://localhost:${PORT}  (model: ${OPENAI_MODEL})`);
});
