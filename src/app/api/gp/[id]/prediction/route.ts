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
  } catch (e) {
    console.error('JWT error', e)
    return null
  }
}

// GET: lista previsioni dell'utente per quel GP
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params

  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json([], { status: 200 })

    const predictions = await prisma.prediction.findMany({
      where: {
        userId: user.sub,
        gpId: id,
      },
    })

    return NextResponse.json(predictions)
  } catch (e) {
    console.error('GET prediction error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST: crea UNA previsione (max 6) se mancano >10 min alle qualifiche
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params

  try {
    const user = getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const gp = await prisma.grandPrix.findUnique({
      where: { id },
    })

    if (!gp) {
      return NextResponse.json({ error: 'GP non trovato' }, { status: 404 })
    }

    const now = new Date()
    const qualiTime = new Date(gp.qualiStartUtc)
    const diffMs = qualiTime.getTime() - now.getTime()
    const diffMinutes = diffMs / 1000 / 60

    console.log('⏱ diffMinutes', diffMinutes)

    if (diffMinutes <= 10) {
      return NextResponse.json(
        {
          error:
            'Previsioni chiuse (mancano meno di 10 minuti alle qualifiche)',
        },
        { status: 400 },
      )
    }

    const existingCount = await prisma.prediction.count({
      where: {
        userId: user.sub,
        gpId: id,
      },
    })

    console.log('📊 existingCount', existingCount)

    if (existingCount >= 6) {
      return NextResponse.json(
        { error: 'Hai già fatto 6 previsioni per questo GP' },
        { status: 400 },
      )
    }

    const body = await req.json()
    console.log('📥 body', body)

    const prediction = await prisma.prediction.create({
      data: {
        userId: user.sub,
        gpId: id,
        type: body.type,
        payload: body.payload,
      },
    })

    console.log('✅ prediction creata', prediction.id)

    return NextResponse.json(prediction, { status: 201 })
  } catch (e: any) {
    console.error('POST prediction error', e)
    return NextResponse.json(
      { error: e.message || 'Server error' },
      { status: 500 },
    )
  }
}
