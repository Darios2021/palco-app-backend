// src/routes/auth.js
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { getDB } from '../db.js'

const r = Router()
const ACCESS_TOKEN_TTL = parseInt(process.env.ACCESS_TOKEN_TTL || '900')
const REFRESH_TOKEN_TTL = parseInt(process.env.REFRESH_TOKEN_TTL || '1209600')
const isProd = process.env.NODE_ENV === 'production'

function signAccess(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  )
}

function signRefresh(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL
  })
}

function setRefreshCookie(res, token) {
  res.cookie('rt', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/api/auth/',
    domain: process.env.COOKIE_DOMAIN || undefined,
    maxAge: REFRESH_TOKEN_TTL * 1000
  })
}

r.post('/login', async (req, res, next) => {
  try {
    const { User, RefreshToken } = getDB().models
    const { email, password } = req.body || {}

    const user = await User.findOne({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const jti = nanoid(32)
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000)
    await RefreshToken.create({ jti, userId: user.id, expiresAt })

    const refresh = signRefresh({ sub: user.id, jti })
    setRefreshCookie(res, refresh)

    res.json({
      accessToken: signAccess(user),
      user: { id: user.id, name: user.name, email: user.email }
    })
  } catch (e) { next(e) }
})

r.post('/refresh', async (req, res, next) => {
  try {
    const { RefreshToken, User } = getDB().models
    const rt = req.cookies?.rt
    if (!rt) return res.status(401).json({ error: 'Missing refresh cookie' })

    const payload = jwt.verify(rt, process.env.JWT_REFRESH_SECRET)
    const saved = await RefreshToken.findOne({ where: { jti: payload.jti } })
    if (!saved || saved.revokedAt || saved.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Refresh token invalid' })
    }

    const user = await User.findByPk(payload.sub)
    if (!user) return res.status(401).json({ error: 'User not found' })

    const newJti = nanoid(32)
    await saved.update({ revokedAt: new Date(), replacedBy: newJti })
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000)
    await RefreshToken.create({ jti: newJti, userId: user.id, expiresAt })

    const newRefresh = signRefresh({ sub: user.id, jti: newJti })
    setRefreshCookie(res, newRefresh)

    res.json({
      accessToken: signAccess(user),
      user: { id: user.id, name: user.name, email: user.email }
    })
  } catch (e) { next(e) }
})

r.post('/logout', async (req, res, next) => {
  try {
    const { RefreshToken } = getDB().models
    const rt = req.cookies?.rt
    if (rt) {
      try {
        const payload = jwt.verify(rt, process.env.JWT_REFRESH_SECRET)
        const saved = await RefreshToken.findOne({ where: { jti: payload.jti } })
        if (saved) await saved.update({ revokedAt: new Date() })
      } catch {}
    }
    res.clearCookie('rt', { path: '/api/auth/' })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

r.get('/me', async (req, res, next) => {
  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return res.status(401).json({ error: 'Missing access token' })

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    const { User } = getDB().models
    const user = await User.findByPk(payload.sub)
    if (!user) return res.status(404).json({ error: 'User not found' })

    res.json({ id: user.id, email: user.email, name: user.name })
  } catch (e) { next(e) }
})

export default r
