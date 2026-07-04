# Employee Chatbot Developer Guide

This document explains the application architecture, major features, runtime flow, API endpoints, data files, and common use cases for the Employee Chatbot system.

## 1. Application Overview

The Employee Chatbot is an internal assistant for answering employee questions using company-controlled knowledge files. The app has:

- A React/Vite client for the chat UI.
- An Express API server.
- Server-Sent Events for streaming LLM responses.
- Local JSON file storage for conversations and interaction logs.
- Local knowledge retrieval from product and policy files.
- OpenAI/OpenRouter-compatible LLM calls.
- Export support for conversation history.

The assistant is intentionally grounded: it builds context from local knowledge files and instructs the model to answer only from that context.

## 2. High-Level Architecture

```text
React Client
  ├─ Sidebar: conversation list and new chat
  ├─ Header: model selection and export buttons
  ├─ MessageList: formatted chat transcript
  └─ ChatInput: sends user prompt

Express Server
  ├─ /api/models
  ├─ /api/conversations
  ├─ /api/conversations/:id/chat
  ├─ /api/conversations/:id/export
  └─ /api/logs

Server Services
  ├─ storage.js: JSON conversation persistence
  ├─ knowledge.js: product/policy retrieval
  ├─ openai.js: prompt assembly and streaming LLM calls
  └─ logger.js: token/cost interaction logging

Local Data
  ├─ knowledge/products.json
  ├─ knowledge/product-guide.md
  ├─ data/conversations/*.json
  └─ data/logs/interactions.json
```

## 3. Tech Stack

### Client

- React 19
- Vite
- Plain CSS in `client/src/index.css`
- Fetch API for REST and streaming calls

### Server

- Node.js
- Express
- OpenAI JavaScript SDK
- `express-rate-limit`
- `uuid`
- Local filesystem JSON persistence

## 4. Project Structure

```text
.
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── index.css
│   │   └── components/
│   │       ├── ChatInput.jsx
│   │       ├── ExportMenu.jsx
│   │       ├── MessageList.jsx
│   │       ├── ModelSelect.jsx
│   │       └── Sidebar.jsx
│   └── vite.config.js
├── server/
│   ├── index.js
│   ├── config/
│   │   └── models.js
│   ├── middleware/
│   │   └── rateLimit.js
│   ├── routes/
│   │   ├── chat.js
│   │   ├── conversations.js
│   │   ├── export.js
│   │   ├── logs.js
│   │   └── models.js
│   └── services/
│       ├── knowledge.js
│       ├── logger.js
│       ├── openai.js
│       └── storage.js
├── knowledge/
│   ├── products.json
│   └── product-guide.md
├── data/
│   ├── conversations/
│   └── logs/
├── docs/
│   └── DEVELOPER_GUIDE.md
└── package.json
```

## 5. Environment Configuration

Create a `.env` file in the project root.

Common variables:

```env
OPENAI_API_KEY=your_api_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
LLM_PROVIDER=openai
OPENAI_BASE_URL=
PORT=3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=20

MAX_PROMPT_TOKENS=8000
MAX_OUTPUT_TOKENS=700
MAX_CONTEXT_CHARS=8000
MAX_HISTORY_MESSAGES=12
```

### OpenAI vs OpenRouter

Model configuration lives in `server/config/models.js`.

- Standard OpenAI keys use model IDs like `gpt-4o-mini`.
- OpenRouter keys should be stored in `OPENROUTER_API_KEY`, usually start with `sk-or-`, and use IDs like `openai/gpt-4o-mini`.
- Set `LLM_PROVIDER=openrouter` to force OpenRouter mode.
- You can also force a custom provider by setting `OPENAI_BASE_URL`.

## 6. Running the Application

Install dependencies:

```bash
npm install
npm install --prefix client
```

Run client and server together:

```bash
npm run dev
```

Run only the API server:

```bash
npm run dev:server
```

Run only the React client:

```bash
npm run dev:client
```

Build the client:

```bash
npm run build
```

Run production build:

```bash
npm run build:start
```

## 7. Client Flow

### `client/src/App.jsx`

`App.jsx` is the main client controller. It:

1. Loads available models from `/api/models`.
2. Loads existing conversations from `/api/conversations`.
3. Opens the latest conversation, or creates a new one if none exists.
4. Tracks the selected model, current conversation ID, messages, streaming state, errors, and usage.
5. Sends chat messages using `streamChat`.
6. Updates the UI as streaming chunks arrive.
7. Shows token usage and estimated cost after each completed response.

### `client/src/api.js`

This file contains all client API helpers:

- `fetchModels()`
- `fetchConversations()`
- `createConversation()`
- `fetchConversation(id)`
- `streamChat(id, message, model, onEvent)`
- `exportConversation(id, format)`

`streamChat` reads the server-sent event stream and emits parsed events to the UI:

- `chunk`: partial assistant text.
- `done`: final token usage and cost.
- `error`: server-side chat failure.

### `client/src/components/MessageList.jsx`

The message list renders the chat transcript. Assistant messages support lightweight formatting:

- Paragraphs
- Bullet lists
- Numbered lists
- Fenced code blocks
- Copy button for assistant responses
- Streaming typing indicator

This keeps LLM answers readable without adding a Markdown dependency.

## 8. Server Flow

### `server/index.js`

The Express entry point:

- Loads `.env`.
- Enables CORS and JSON request bodies.
- Registers API routes.
- Serves the built React app in production.
- Starts the HTTP server on `PORT`, defaulting to `3000`.

### Request/Response Flow for Chat

```text
User submits message
  ↓
client/src/api.js POST /api/conversations/:id/chat
  ↓
server/routes/chat.js validates conversation, model, and message
  ↓
server/services/openai.js builds prompt
  ↓
server/services/knowledge.js retrieves relevant local context
  ↓
OpenAI/OpenRouter streams response
  ↓
server/routes/chat.js forwards chunks as SSE
  ↓
client updates assistant message live
  ↓
server stores final messages and logs usage
```

## 9. API Endpoints

### Health

```http
GET /api/health
```

Returns server status and uptime.

### Models

```http
GET /api/models
```

Returns available model IDs and labels for the UI dropdown.

### Conversations

```http
GET /api/conversations
```

Returns conversation summaries sorted by `updatedAt` descending.

```http
POST /api/conversations
```

Creates a new conversation.

```http
GET /api/conversations/:id
```

Returns a full conversation with messages.

### Chat

```http
POST /api/conversations/:id/chat
Content-Type: application/json

{
  "message": "Tell me about CloudSync Pro",
  "model": "gpt-4o-mini"
}
```

Streams events using `text/event-stream`.

Example events:

```text
data: {"type":"chunk","content":"CloudSync Pro"}

data: {"type":"done","usage":{"inputTokens":500,"outputTokens":120,"estimatedCostUsd":0.000147}}
```

### Export

```http
GET /api/conversations/:id/export?format=json
GET /api/conversations/:id/export?format=csv
```

Exports a conversation as JSON or CSV.

### Logs

```http
GET /api/logs?page=1&limit=50
```

Returns paginated interaction logs.

## 10. Knowledge Retrieval

Knowledge retrieval is routed through `server/services/retrieval.js`.

For a detailed explanation of keyword retrieval, vector retrieval, embeddings, Chroma, and how context is passed to the LLM, see [Retrieval and Vector Database Deep Dive](RETRIEVAL_AND_VECTOR_DB.md).

The app supports two retrieval modes:

- `RETRIEVAL_MODE=vector`: use Chroma semantic retrieval first.
- `RETRIEVAL_MODE=keyword`: use the legacy keyword matcher directly.

When vector mode is enabled but Chroma is unavailable, empty, or errors, the adapter automatically falls back to `server/services/knowledge.js`.

The app loads source knowledge from:

- `knowledge/products.json`
- `knowledge/product-guide.md`

### Vector Retrieval

Vector retrieval is implemented in `server/services/vectorKnowledge.js`.

It uses:

- Chroma collection: `CHROMA_COLLECTION`, default `employee_knowledge`
- Chroma URL: `CHROMA_URL`, default `http://localhost:8000`
- Top result count: `VECTOR_TOP_K`, default `5`
- Chroma default local embeddings

Start local persistent Chroma:

```bash
npm run chroma:start
```

Check Chroma connectivity and collection count:

```bash
npm run knowledge:health
```

Index local knowledge:

```bash
npm run knowledge:index
```

Test vector search:

```bash
npm run knowledge:test
```

The indexer rebuilds the configured collection from local knowledge files and uses deterministic IDs such as `product:CSP-001` and `guide:return-and-refund-policy`.

### Legacy Keyword Retrieval

Legacy keyword retrieval remains in `server/services/knowledge.js` and is not removed.

### Product Knowledge

Each product in `products.json` becomes a searchable document/chunk with:

- Product name
- SKU
- Price
- Category
- Specs
- Support notes
- Search metadata

### Guide Knowledge

`product-guide.md` is split by Markdown headings. Each heading section becomes its own retrieval document/chunk.

### Important Behavior

If the user asks about something not present in local knowledge, the system prompt tells the model to say it does not have that information.

If product questions are returning poor answers, check:

1. Does the product exist in `knowledge/products.json`?
2. Are the product name, category, specs, and notes descriptive enough?
3. If vector mode is enabled, was `npm run knowledge:index` rerun after editing knowledge files?
4. Is Chroma running at `CHROMA_URL`?
5. Is `MAX_CONTEXT_CHARS` large enough for the retrieved context?

## 11. Prompt and Token Management

Prompt building is handled by `server/services/openai.js`.

It creates:

1. A system prompt instructing the model to answer only from provided context.
2. Retrieved context from local knowledge files.
3. A trimmed slice of recent conversation history.
4. The current user message.

Token safety settings:

- `MAX_PROMPT_TOKENS`: approximate prompt budget.
- `MAX_OUTPUT_TOKENS`: response length cap.
- `MAX_CONTEXT_CHARS`: maximum retrieved context text size.
- `MAX_HISTORY_MESSAGES`: maximum recent messages included.

These limits prevent long conversations from exhausting the model context window.

## 12. Conversation Storage

Conversation storage is implemented in `server/services/storage.js`.

Each conversation is saved as:

```text
data/conversations/:conversationId.json
```

Conversation shape:

```json
{
  "id": "uuid",
  "title": "New conversation",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp",
  "messages": [
    {
      "role": "user",
      "content": "Question",
      "timestamp": "ISO timestamp"
    },
    {
      "role": "assistant",
      "content": "Answer",
      "timestamp": "ISO timestamp"
    }
  ]
}
```

The first user message becomes the conversation title.

Conversation IDs are validated as UUIDs before file paths are used.

## 13. Logging and Cost Tracking

Interaction logging is implemented in `server/services/logger.js`.

Logs are stored in:

```text
data/logs/interactions.json
```

Each log entry contains:

- Timestamp
- Conversation ID
- Model
- User message
- Assistant message
- Input tokens
- Output tokens
- Estimated cost in USD

Cost estimates are calculated using pricing metadata in `server/config/models.js`.

## 14. Rate Limiting

Rate limiting is implemented in `server/middleware/rateLimit.js`.

Chat requests:

- Default window: `60,000ms`
- Default max: `20` requests per window
- Configurable via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX`

New conversation creation:

- `10` requests per minute

## 15. Export Features

Conversation export is implemented in `server/routes/export.js`.

Supported formats:

- JSON: full conversation object.
- CSV: rows for each message with conversation ID, timestamp, role, content, and model when available.

## 16. Current Product Use Cases

The assistant can support these product-related use cases:

1. List all available products.
2. Explain a specific product.
3. Look up product pricing.
4. Look up product SKU.
5. Compare product categories.
6. Answer product storage limits.
7. Answer max-user limits.
8. Answer encryption details.
9. Explain SSO availability.
10. Explain support notes for a product.
11. Identify products by SKU.
12. Answer API rate limit questions when product or guide context exists.
13. Explain product onboarding notes where documented.
14. Recommend escalation paths when documented in the guide.

## 17. Current Policy and Support Use Cases

The assistant can support these internal knowledge use cases:

1. Return and refund policy questions.
2. Support tier explanation.
3. Employee discount code lookup.
4. Data export process.
5. Data deletion process.
6. Onboarding process explanation.
7. SSO troubleshooting.
8. API rate limit troubleshooting.
9. Billing dispute escalation.
10. General employee support workflow questions covered in the guide.

## 18. UI Features

The React UI supports:

- Conversation sidebar.
- New conversation creation.
- Existing conversation loading.
- Model selection.
- Streaming assistant responses.
- Token and estimated cost display.
- JSON/CSV export buttons.
- Error banner.
- Empty-state prompt suggestions.
- Formatted assistant messages.
- Copy button for assistant answers.
- Mobile-friendly layout.

## 19. Common Debugging Notes

### The assistant says it does not have product information

Check:

- The product exists in `knowledge/products.json`.
- The backend was restarted after knowledge edits.
- The retrieval query matches an existing product, SKU, category, or guide section.
- `server/services/knowledge.js` returns the expected context for the question.

Quick local test:

```bash
node -e "const {retrieveContext}=require('./server/services/knowledge'); console.log(retrieveContext('tell me about secure vault'))"
```

### The provider says tokens or context are exhausted

Check:

- `MAX_PROMPT_TOKENS`
- `MAX_OUTPUT_TOKENS`
- `MAX_CONTEXT_CHARS`
- `MAX_HISTORY_MESSAGES`

If the error mentions quota, credits, or billing, the provider account/key likely needs more credits.

### The client cannot reach the server

Check that the API server is running:

```bash
npm run dev:server
```

The default API server runs on:

```text
http://localhost:3000
```

### Port 3000 is already in use

Stop the existing process or set a new `PORT` in `.env`.

### Logs or conversations look corrupted

The app stores local JSON files. If a file is manually edited and invalid JSON is introduced:

- Conversation lists skip malformed conversation summaries.
- Logs fall back to an empty list if the log file cannot be parsed.

## 20. Future Improvements

Good next development steps:

1. Add semantic/vector search for larger knowledge bases.
2. Add admin UI for editing products and guide content.
3. Add authentication before exposing internal logs/conversations.
4. Add delete/rename conversation actions.
5. Add automated tests for retrieval and prompt building.
6. Add source citations in the UI.
7. Add structured product comparison cards.
8. Move storage from JSON files to SQLite or Postgres for multi-user deployments.
9. Add per-user conversation ownership.
10. Add production logging and observability.
