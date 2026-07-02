import winston from 'winston'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import 'dotenv/config'

const { combine, timestamp, colorize, printf, json } = winston.format

// ── Console format ────────────────────────────────────────────
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
  return `${timestamp} [${level}]: ${message}${metaStr}`
})

// ── Custom Supabase transport ─────────────────────────────────
class SupabaseTransport extends winston.transports.Console {
  constructor(opts = {}) {
    super(opts)
    this.name = 'supabase'
    this.level = opts.level || 'info'
    this._client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        realtime: { transport: ws }, // fix for Node.js < 22 missing native WebSocket
      }
    )
  }

  log(info, callback) {
    // Fire-and-forget DB insert
    this._client
      .from('logs')
      .insert({
        level: info.level,
        message: info.message,
        meta: info.meta || null,
      })
      .then(() => {})
      .catch(() => {}) // never crash the app on log failure

    callback()
  }
}

// ── Logger instance ───────────────────────────────────────────
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports: [
    // Pretty console output
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        consoleFormat
      ),
    }),
    // Structured file log
    new winston.transports.File({
      filename: 'logs/app.log',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3,
      format: combine(timestamp(), json()),
    }),
    // DB log (only if env vars present)
    ...(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? [new SupabaseTransport({ level: 'info' })]
      : []),
  ],
})

export default logger
