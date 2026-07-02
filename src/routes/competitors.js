import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const CompetitorSchema = z.object({
  name: z.string().min(2),
  keywords: z.array(z.string().min(1)).min(1, 'At least one keyword required'),
  category: z.string().optional(),
})

router.get('/', authMiddleware, async (req, res) => {
  const { data, error } = await db.from('competitors').select('*').order('name')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// GET /api/competitors/stats — accurate sentiment + article counts per brand
// Computed from ALL matching rows in the DB (no pagination limit), so this
// is always consistent between the dashboard Brand Pulse widget and the
// individual brand profile page.
router.get('/stats', authMiddleware, async (req, res) => {
  const { data: competitors, error: compErr } = await db
    .from('competitors').select('*').order('name')
  if (compErr) return res.status(500).json({ error: compErr.message })

  const { data: rows, error: rowsErr } = await db
    .from('articles')
    .select('competitor_id, sentiment')
    .eq('is_noise', false)
    .not('competitor_id', 'is', null)

  if (rowsErr) return res.status(500).json({ error: rowsErr.message })

  const statsMap = {}
  for (const r of rows || []) {
    if (!statsMap[r.competitor_id]) statsMap[r.competitor_id] = { pos: 0, neg: 0, neu: 0, total: 0 }
    const bucket = r.sentiment === 'positive' ? 'pos' : r.sentiment === 'negative' ? 'neg' : 'neu'
    statsMap[r.competitor_id][bucket]++
    statsMap[r.competitor_id].total++
  }

  const result = (competitors || []).map(c => ({
    ...c,
    stats: statsMap[c.id] || { pos: 0, neg: 0, neu: 0, total: 0 },
  }))

  res.json(result)
})

router.post('/', authMiddleware, async (req, res) => {
  const result = CompetitorSchema.safeParse(req.body)
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message })

  const { data, error } = await db
    .from('competitors').insert(result.data).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data)
})

router.patch('/:id', authMiddleware, async (req, res) => {
  const { data, error } = await db
    .from('competitors').update(req.body).eq('id', req.params.id).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

router.delete('/:id', authMiddleware, async (req, res) => {
  const { error } = await db.from('competitors').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ success: true })
})

export default router
