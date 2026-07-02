import { Router } from 'express'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// GET /api/logs — recent activity logs from DB
router.get('/', authMiddleware, async (req, res) => {
  const { level, limit = 100 } = req.query

  let query = db
    .from('logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Number(limit))

  if (level) query = query.eq('level', level)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

export default router
