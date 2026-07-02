import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { db } from '../db.js'
import logger from '../logger.js'

const router = Router()

const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const result = SignupSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message })
  }

  const { name, email, password } = result.data

  // Check existing user
  const { data: existing } = await db
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' })
  }

  const password_hash = await bcrypt.hash(password, 12)

  const { data: user, error } = await db
    .from('users')
    .insert({ name, email, password_hash })
    .select('id, name, email, role, created_at')
    .single()

  if (error) {
    logger.error('Signup failed', { error: error.message })
    return res.status(500).json({ error: 'Failed to create account' })
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  logger.info('User signed up', { email })
  res.status(201).json({ token, user })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const result = LoginSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message })
  }

  const { email, password } = result.data

  const { data: user } = await db
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  logger.info('User logged in', { email })
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })
})

export default router
