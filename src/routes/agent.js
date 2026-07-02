import { Router } from 'express'
import { runAgent } from '../agent.js'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import logger from '../logger.js'

const router = Router()

// POST /api/agent/run — trigger a manual run
router.post('/run', authMiddleware, async (req, res) => {
  logger.info('Manual agent run triggered', { user: req.user.email })
  try {
    const result = await runAgent('manual')
    res.json(result)
  } catch (err) {
    logger.error('Agent run API error', { error: err.message })
    res.status(500).json({ error: err.message })
  }
})

// GET /api/agent/runs — run history
router.get('/runs', authMiddleware, async (req, res) => {
  const { data, error } = await db
    .from('agent_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(20)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

export default router
