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

export async function GET(req: NextRequest) {
  try {
    const gps = await prisma.grandPrix.findMany({
      orderBy: { roundNumber: "asc" },
    });

    return NextResponse.json(gps, { status: 200 });
  } catch (err) {
    console.error("GET /api/gp error", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: "Non autorizzato" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const gp = await prisma.grandPrix.create({
      data: {
        name: body.name,
        roundNumber: Number(body.roundNumber),
        fp1StartUtc: new Date(body.fp1StartUtc),
        qualiStartUtc: new Date(body.qualiStartUtc),
        raceStartUtc: new Date(body.raceStartUtc),
      },
    });

    return NextResponse.json(gp, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/gp error", err);
    return NextResponse.json(
      {
        error: "Errore interno",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
