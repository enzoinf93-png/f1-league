import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function getUserFromRequest(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .filter(Boolean)
      .map((c) => {
        const [k, v] = c.trim().split("=");
        return [k, v];
      })
  );
  const token = cookies["auth"];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { error: "Devi essere loggato per accettare l'invito" },
      { status: 401 }
    );
  }

  const { token } = await req.json();

  const invite = await prisma.leagueInvite.findUnique({
    where: { token },
  });

  if (!invite) {
    return NextResponse.json(
      { error: "Invito non valido" },
      { status: 400 }
    );
  }

  if (invite.used) {
    return NextResponse.json(
      { error: "Invito già usato" },
      { status: 400 }
    );
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Invito scaduto" },
      { status: 400 }
    );
  }

  await prisma.leagueMember.upsert({
    where: {
      leagueId_userId: {
        leagueId: invite.leagueId,
        userId: user.id,
      },
    },
    update: {},
    create: {
      leagueId: invite.leagueId,
      userId: user.id,
    },
  });

  await prisma.leagueInvite.update({
    where: { id: invite.id },
    data: { used: true },
  });

  return NextResponse.json({ ok: true, leagueId: invite.leagueId });
}
