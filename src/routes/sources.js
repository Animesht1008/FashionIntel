import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const SourceSchema = z.object({
  name: z.string().min(2),
  domain: z.string().optional(),
})

router.get('/', authMiddleware, async (req, res) => {
  const { data, error } = await db.from('sources').select('*').order('name')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/', authMiddleware, async (req, res) => {
  const result = SourceSchema.safeParse(req.body)
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message })

  const { data, error } = await db
    .from('sources').insert(result.data).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data)
})

router.patch('/:id', authMiddleware, async (req, res) => {
  const { data, error } = await db
    .from('sources').update(req.body).eq('id', req.params.id).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

router.delete('/:id', authMiddleware, async (req, res) => {
  const { error } = await db.from('sources').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ success: true })
})

export default router
