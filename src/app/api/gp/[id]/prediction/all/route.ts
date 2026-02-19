import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function getUserFromRequest(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader
      .split(';')
      .filter(Boolean)
      .map((c) => {
        const [k, v] = c.trim().split('=');
        return [k, v];
      }),
  );
  const token = cookies['auth'];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return payload;
  } catch {
    return null;
  }
}

// GET: tutte le previsioni per un GP
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  // troviamo il GP (ora globale, non più legato a una sola lega)
  const gp = await prisma.grandPrix.findUnique({
    where: { id },
  });

  if (!gp) {
    return NextResponse.json({ error: 'GP non trovato' }, { status: 404 });
  }

  const predictions = await prisma.prediction.findMany({
    where: { gpId: id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ user: { name: 'asc' } }, { createdAt: 'asc' }],
  });

  return NextResponse.json(
    {
      gp: {
        id: gp.id,
        name: gp.name,
        roundNumber: gp.roundNumber,
        qualiStartUtc: gp.qualiStartUtc,
      },
      predictions,
    },
    { status: 200 },
  );
}
