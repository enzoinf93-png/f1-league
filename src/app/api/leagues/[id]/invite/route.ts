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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await context.params;
  const user = getUserFromRequest(req);
  console.log("INVITE API user:", user);

  if (!user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
  });

  console.log("INVITE API league:", league);

  if (!league) {
    return NextResponse.json({ error: "League non trovata" }, { status: 404 });
  }

    console.log("INVITE API compare:", {
    leagueAdminId: league.adminId,
    userId: (user as any).id,
    userSub: (user as any).sub,
  });

  const userId = (user as any).id ?? (user as any).sub;

  if (league.adminId !== userId) {
    return NextResponse.json(
      { error: "Solo l'admin può creare inviti" },
      { status: 403 }
    );
  }



  const token = "inv_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invite = await prisma.leagueInvite.create({
    data: {
      token,
      leagueId,
      expiresAt,
    },
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  return NextResponse.json({
    inviteUrl: `${baseUrl}/invite/${invite.token}`,
  });
}
