# Employee Chatbot

An internal employee chatbot built with React, Express, and an OpenAI-compatible LLM API. The assistant answers questions using local company knowledge files, streams responses to the UI, stores conversations as JSON, logs token usage/costs, and supports exporting conversation history.

## Features

- React/Vite chat interface
- Streaming assistant responses with Server-Sent Events
- Local knowledge retrieval from product and policy files
- OpenAI and OpenRouter-compatible model support
- Conversation history stored in local JSON files
- Token usage and estimated cost logging
- JSON and CSV conversation export
- Rate limiting for chat and conversation creation
- Lightweight formatted assistant answers in the UI
- Developer documentation in [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)

## Tech Stack

- Client: React 19, Vite, CSS
- Server: Node.js, Express
- LLM SDK: OpenAI JavaScript SDK
- Storage: local JSON files
- Knowledge base: JSON and Markdown files

## Project Structure

```text
.
├── client/                  # React/Vite frontend
├── server/                  # Express backend
├── knowledge/               # Product and policy knowledge files
├── data/                    # Local conversations and interaction logs
├── docs/                    # Developer documentation
├── .env.example             # Example environment variables
└── package.json             # Root scripts and backend dependencies
```

## Getting Started

### 1. Install dependencies

```bash
npm install
npm install --prefix client
```

### 2. Configure environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then set your API key:

```env
OPENAI_API_KEY=your_api_key_here
LLM_PROVIDER=openai
```

For OpenRouter, use an OpenRouter key and optionally set:

```env
OPENROUTER_API_KEY=your_openrouter_key_here
LLM_PROVIDER=openrouter
OPENAI_BASE_URL=https://openrouter.ai/api/v1
```

OpenRouter keys usually start with `sk-or-`. To test your OpenRouter setup:

```bash
npm run test:openrouter
```

### 3. Run the app

Start the client and server together:

```bash
npm run dev
```

The backend defaults to:

```text
http://localhost:3000
```

The Vite frontend will print its local URL in the terminal.

## Useful Scripts

```bash
npm run dev          # Run server and client together
npm run dev:server   # Run only the Express API
npm run dev:client   # Run only the React client
npm run build        # Build the React client
npm start            # Start the Express server
npm run build:start  # Build client, then start production server
npm run test:openrouter # Verify OpenRouter with a tiny live request
```

## Knowledge Base

Knowledge files live in:

```text
knowledge/products.json
knowledge/product-guide.md
```

`products.json` contains structured product data such as:

- Product name
- SKU
- Price
- Category
- Specs
- Support notes

`product-guide.md` contains policy and support guide sections such as:

- Refund policy
- Support tiers
- Employee discounts
- Data export and deletion
- Onboarding process
- Troubleshooting procedures

After editing knowledge files, restart the backend server so the updated knowledge is loaded.

## Current Product Catalog

The starter knowledge base includes:

- CloudSync Pro
- SecureVault Enterprise
- TeamFlow Basic
- AnalyticsHub
- DevPipeline CI
- NotifyPulse
- HelpDesk AI
- PeopleOps Portal
- FinanceGuard
- LaunchPad CRM
- FieldTrack Mobile
- LearnLoop LMS

Example questions:

- `List our products`
- `What is the price of SecureVault Enterprise?`
- `Does CloudSync Pro support SSO?`
- `Which product supports SCORM?`
- `Tell me about FinanceGuard compliance reports`
- `What is the API rate limit for AnalyticsHub?`

## API Overview

### Health

```http
GET /api/health
```

### Models

```http
GET /api/models
```

### Conversations

```http
GET /api/conversations
POST /api/conversations
GET /api/conversations/:id
```

### Chat

```http
POST /api/conversations/:id/chat
```

Request body:

```json
{
  "message": "Tell me about CloudSync Pro",
  "model": "gpt-4o-mini"
}
```

The chat endpoint streams events back to the client.

### Export

```http
GET /api/conversations/:id/export?format=json
GET /api/conversations/:id/export?format=csv
```

### Logs

```http
GET /api/logs?page=1&limit=50
```

## Data Storage

Conversations are stored in:

```text
data/conversations/*.json
```

Interaction logs are stored in:

```text
data/logs/interactions.json
```

These files are useful for local development and demos. For multi-user production usage, consider moving persistence to SQLite, Postgres, or another managed database.

## Token and Prompt Safety

The app includes prompt-size controls to avoid sending too much history/context to the selected model:

```env
MAX_PROMPT_TOKENS=8000
MAX_OUTPUT_TOKENS=700
MAX_CONTEXT_CHARS=8000
MAX_HISTORY_MESSAGES=12
```

If the provider reports exhausted credits or quota, update billing/credits for the API key or switch to another key/model.

## Troubleshooting

### The assistant says it does not have information

Check that:

- The answer exists in `knowledge/products.json` or `knowledge/product-guide.md`.
- The backend was restarted after editing knowledge files.
- The question references a product name, SKU, category, or guide topic.

### The API server cannot start

Port `3000` may already be in use. Stop the existing process or set a different `PORT` in `.env`.

### The frontend cannot reach the backend

Make sure the server is running:

```bash
npm run dev:server
```

## Full Developer Documentation

For deeper implementation details, see:

[docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)
