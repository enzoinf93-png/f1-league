import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

export async function POST(req: Request) {
  const formData = await req.formData()
  const email = String(formData.get('email') || '')
  const password = String(formData.get('password') || '')

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.redirect(new URL('/?error=credenziali', req.url))
  }

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) {
    return NextResponse.redirect(new URL('/?error=credenziali', req.url))
  }

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      leagueId: user.leagueId,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  const res = NextResponse.redirect(new URL('/league', req.url))
  res.cookies.set('auth', token, { httpOnly: true, sameSite: 'lax', path: '/' })
  return res
}
