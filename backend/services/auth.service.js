import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'

export const register = async ({ full_name, email, password, phone }) => {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) throw new Error('Email already in use')

  const password_hash = await bcrypt.hash(password, 10)
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO users (full_name, email, password_hash, phone) VALUES (?, ?, ?, ?)'
  ).run(full_name, email, password_hash, phone ?? null)

  const user = db.prepare('SELECT id, full_name, email, phone FROM users WHERE id = ?').get(lastInsertRowid)
  const token = jwt.sign({ id: user.id, email: user.email, full_name: user.full_name }, process.env.JWT_SECRET, { expiresIn: '7d' })
  return { user, token }
}

export const login = async ({ email, password }) => {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user) throw new Error('Invalid email or password')

  const match = await bcrypt.compare(password, user.password_hash)
  if (!match) throw new Error('Invalid email or password')

  const token = jwt.sign({ id: user.id, email: user.email, full_name: user.full_name }, process.env.JWT_SECRET, { expiresIn: '7d' })
  return { user: { id: user.id, full_name: user.full_name, email: user.email, phone: user.phone }, token }
}

export const getProfile = (userId) => {
  return db.prepare('SELECT id, full_name, email, phone, created_at FROM users WHERE id = ?').get(userId)
}
