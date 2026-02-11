import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

function getUserFromRequest(req: Request) {
  const cookieHeader = req.headers.get('cookie') || ''
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, v] = c.trim().split('=')
      return [k, v]
    }),
  )
  const token = cookies['auth']
  if (!token) return null
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    return payload
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json([], { status: 200 })

  const gps = await prisma.grandPrix.findMany({
    where: { leagueId: user.leagueId },
    orderBy: { roundNumber: 'asc' },
  })

  return NextResponse.json(gps)
}

export async function POST(req: Request) {
  const user = getUserFromRequest(req)
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const body = await req.json()

  const gp = await prisma.grandPrix.create({
    data: {
      name: body.name,
      roundNumber: Number(body.roundNumber),
      fp1StartUtc: new Date(body.fp1StartUtc),
      qualiStartUtc: new Date(body.qualiStartUtc),
      raceStartUtc: new Date(body.raceStartUtc),
      leagueId: user.leagueId,
    },
  })

  return NextResponse.json(gp, { status: 201 })
}
