# 👗 Fashion Intel — Fashion Brand News Monitoring Agent

An AI-powered Node.js agent that monitors fashion brand news in real time, filters noise intelligently, and delivers structured brand intelligence through a clean editorial UI.

---

## ✨ Features

- **AI-powered analysis** — Groq + Llama 3.3 70B scores relevance, detects sentiment, classifies news type, and extracts key insights
- **Noise filtering** — irrelevant articles are automatically discarded (score < 4 / off-topic)
- **Zod validation** — every API request and AI response is validated before touching the database
- **Dual logging** — Winston writes structured logs to file + Supabase `logs` table, viewable in the UI
- **Scheduled runs** — node-cron triggers automatic monitoring every 6 hours (configurable)
- **Full CRUD** — add/remove/toggle topics, brands, and sources via the Settings page
- **Auth** — JWT-based signup/login with bcrypt password hashing
- **Fashion-editorial UI** — dark aesthetic, animated thread background, Playfair Display typography

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express |
| Frontend | Vanilla JS + HTML + CSS (no framework needed) |
| AI | Groq + Llama 3.3 70B |
| News | GNews API |
| Database | Supabase (PostgreSQL) |
| Scheduler | node-cron |
| Validation | Zod |
| Logging | Winston + `logs` table |
| Auth | JWT + bcryptjs |

---

## 🚀 Setup & Run

### 1. Clone and install

```bash
git clone <your-repo-url>
cd fashion-news-agent
npm install
```

### 2. Get your free API keys

| Service | URL | Free tier |
|---|---|---|
| GNews | https://gnews.io | 100 req/day |
| Groq | https://console.groq.com | Generous free tier |
| Supabase | https://supabase.com | Free tier |

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

GROQ_API_KEY=gsk_...

GNEWS_API_KEY=your_gnews_key

JWT_SECRET=a_random_string_at_least_32_characters_long

PORT=3000
NODE_ENV=development

# Cron: every 6 hours (change as needed)
CRON_SCHEDULE=0 */6 * * *
```

### 4. Set up the database

1. Go to your [Supabase project](https://supabase.com) → SQL Editor
2. Paste and run the contents of `supabase/schema.sql`
3. This creates all tables and seeds default topics, brands, and sources

### 5. Run the server

```bash
# Development (with auto-restart on file changes)
npm run dev

# Production
npm start
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📖 How It Works

1. **Sign up / log in** at `/login.html`
2. On the **Dashboard**, click **Run Agent** to trigger a monitoring cycle
3. The agent fetches news for every active topic and brand from GNews
4. Each article is analyzed by Groq AI:
   - Relevance scored 1–10 (articles below 4 are filtered)
   - Sentiment classified (positive / negative / neutral)
   - News type detected (product launch, campaign, discount, earnings, etc.)
   - 2 key insights extracted for brand analysts
5. Results appear in the **Intelligence Feed** with filters by type and sentiment
6. **Settings** → add or remove topics, brands, and sources at any time
7. **Agent Runs** → view full history of every monitoring cycle
8. **Activity Log** → real-time server logs stored in the database

---

## 📁 Project Structure

```
fashion-news-agent/
├── src/
│   ├── index.js              # Express entry point + server start
│   ├── agent.js              # Core agent orchestration logic
│   ├── ai.js                 # Groq AI analysis + Zod validation
│   ├── newsapi.js            # GNews API fetching
│   ├── db.js                 # Supabase client
│   ├── scheduler.js          # node-cron scheduler
│   ├── logger.js             # Winston logger (console + file + DB)
│   └── routes/
│       ├── auth.js           # POST /api/auth/signup, /login
│       ├── agent.js          # POST /api/agent/run, GET /runs
│       ├── articles.js       # GET /api/articles, /stats
│       ├── topics.js         # CRUD /api/topics
│       ├── sources.js        # CRUD /api/sources
│       ├── competitors.js    # CRUD /api/competitors
│       └── logs.js           # GET /api/logs
├── public/
│   ├── index.html            # Auth redirect
│   ├── login.html            # Login + Signup
│   ├── dashboard.html        # News feed + stats
│   ├── settings.html         # Manage topics/brands/sources
│   ├── runs.html             # Agent run history
│   ├── logs.html             # Activity log viewer
│   ├── css/style.css         # Full design system
│   └── js/
│       ├── api.js            # Fetch wrapper for all API calls
│       ├── auth.js           # Session helpers
│       ├── shell.js          # Shared sidebar/layout renderer
│       ├── background.js     # Animated canvas background
│       └── toast.js          # Toast notification system
├── supabase/schema.sql       # Full DB schema + seed data
├── .env.example
└── README.md
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Body |
|---|---|---|
| POST | `/api/auth/signup` | `{ name, email, password }` |
| POST | `/api/auth/login`  | `{ email, password }` |

### Agent *(requires Bearer token)*
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/agent/run`  | Trigger a manual agent run |
| GET  | `/api/agent/runs` | Get last 20 run logs |

### Articles *(requires Bearer token)*
| Method | Endpoint | Query params |
|---|---|---|
| GET | `/api/articles` | `type`, `sentiment`, `topic`, `competitor`, `limit` |
| GET | `/api/articles/stats` | — |

### CRUD endpoints *(all require Bearer token)*
`/api/topics`, `/api/sources`, `/api/competitors` — support `GET`, `POST`, `PATCH /:id`, `DELETE /:id`

### Logs *(requires Bearer token)*
| Method | Endpoint | Query params |
|---|---|---|
| GET | `/api/logs` | `level`, `limit` |

---

## 📝 Approach & Key Decisions

**Why Node.js + Express?** Aligns directly with the role requirements. Clean, lightweight, easy to reason about for a monitoring agent.

**Why Groq + Llama 3.3 70B?** Extremely fast inference (sub-second per article) with strong instruction following. The structured JSON prompt with Zod validation ensures AI responses are always safe to use.

**Why Supabase?** PostgreSQL gives proper relational structure for joins between articles, topics, and competitors. The `logs` table enables in-app log viewing without a separate log service.

**Why Zod?** Validates both inbound API requests (preventing bad data reaching the DB) and AI responses (preventing malformed AI output from crashing the pipeline). Most candidates skip this — it matters in production.

**Why vanilla JS for the frontend?** The role is Node.js developer, not frontend engineer. A clean vanilla JS frontend with a proper design system demonstrates UI competence without over-engineering.

---

## 🔮 Further Development

See `FUTURE.md` for the full roadmap.
