import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const TopicSchema = z.object({
  name: z.string().min(2),
  keywords: z.array(z.string().min(1)).min(1, 'At least one keyword required'),
})

router.get('/', authMiddleware, async (req, res) => {
  const { data, error } = await db.from('topics').select('*').order('name')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/', authMiddleware, async (req, res) => {
  const result = TopicSchema.safeParse(req.body)
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message })

  const { data, error } = await db
    .from('topics').insert(result.data).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data)
})

router.patch('/:id', authMiddleware, async (req, res) => {
  const { data, error } = await db
    .from('topics').update(req.body).eq('id', req.params.id).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

router.delete('/:id', authMiddleware, async (req, res) => {
  const { error } = await db.from('topics').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ success: true })
})

export default router
