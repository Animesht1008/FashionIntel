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

