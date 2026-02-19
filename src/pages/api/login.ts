import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const { email, password } = req.body as { email: string; password: string }

  if (!email || !password) {
    return res.status(400).json({ error: 'Dati mancanti' })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return res.status(401).json({ error: 'Credenziali non valide' })
  }

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) {
    return res.status(401).json({ error: 'Credenziali non valide' })
  }

  const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
  },
  JWT_SECRET,
  { expiresIn: '7d' },
);


  res.setHeader(
    'Set-Cookie',
    `auth=${token}; Path=/; HttpOnly; SameSite=Lax;${
      process.env.NODE_ENV === 'production' ? ' Secure' : ''
    }`,
  )

  return res.status(200).json({ ok: true })
}
