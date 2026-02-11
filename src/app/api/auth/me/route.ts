import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

export async function GET(req: Request) {
  const cookieHeader = req.headers.get('cookie') || ''
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, v] = c.trim().split('=')
      return [k, v]
    }),
  )

  const token = cookies['auth']
  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    return NextResponse.json(
      {
        user: {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          isAdmin: payload.isAdmin,
          leagueId: payload.leagueId,
        },
      },
      { status: 200 },
    )
  } catch {
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
