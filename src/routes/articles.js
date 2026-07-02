import { Router } from 'express'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// GET /api/articles
router.get('/', authMiddleware, async (req, res) => {
  const { topic, competitor, type, sentiment, limit = 50 } = req.query

  let query = db
    .from('articles')
    .select('*, topics(name), competitors(name, category)')
    .eq('is_noise', false)
    .order('published_at', { ascending: false })
    .limit(Number(limit))

  if (topic) query = query.eq('topic_id', topic)
  if (competitor) query = query.eq('competitor_id', competitor)
  if (type) query = query.eq('news_type', type)
  if (sentiment) query = query.eq('sentiment', sentiment)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// GET /api/articles/stats — summary counts for dashboard
router.get('/stats', authMiddleware, async (req, res) => {
  const { data: total } = await db
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('is_noise', false)

  const { data: today } = await db
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('is_noise', false)
    .gte('created_at', new Date(Date.now() - 86400000).toISOString())

  const { data: byType } = await db
    .from('articles')
    .select('news_type')
    .eq('is_noise', false)

  const { data: bySentiment } = await db
    .from('articles')
    .select('sentiment')
    .eq('is_noise', false)

  // Count by type
  const typeCounts = {}
  for (const a of byType || []) {
    typeCounts[a.news_type] = (typeCounts[a.news_type] || 0) + 1
  }

  const sentimentCounts = { positive: 0, negative: 0, neutral: 0 }
  for (const a of bySentiment || []) {
    if (a.sentiment) sentimentCounts[a.sentiment]++
  }

  res.json({
    total: total?.length ?? 0,
    today: today?.length ?? 0,
    byType: typeCounts,
    bySentiment: sentimentCounts,
  })
})

export default router
