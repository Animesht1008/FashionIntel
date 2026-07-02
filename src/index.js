import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

import logger from './logger.js'
import { startScheduler } from './scheduler.js'

import authRoutes from './routes/auth.js'
import agentRoutes from './routes/agent.js'
import articlesRoutes from './routes/articles.js'
import topicsRoutes from './routes/topics.js'
import sourcesRoutes from './routes/sources.js'
import competitorsRoutes from './routes/competitors.js'
import logsRoutes from './routes/logs.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

// ── Middleware ────────────────────────────────────────────────
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '../public')))

// Request logger
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`)
  next()
})

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/agent', agentRoutes)
app.use('/api/articles', articlesRoutes)
app.use('/api/topics', topicsRoutes)
app.use('/api/sources', sourcesRoutes)
app.use('/api/competitors', competitorsRoutes)
app.use('/api/logs', logsRoutes)

// ── SPA fallback — serve index.html for all non-API routes ───
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'))
})

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, path: req.path })
  res.status(500).json({ error: 'Internal server error' })
})

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`Fashion News Agent running on http://localhost:${PORT}`)
  startScheduler()
})

export default app
