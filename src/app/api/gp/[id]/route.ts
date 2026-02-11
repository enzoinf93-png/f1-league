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

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // 👈 qui aspettiamo la Promise
  const user = getUserFromRequest(req);

  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const gpId = id;

    if (!gpId) {
      return NextResponse.json(
        { error: "GP id mancante nei params" },
        { status: 400 }
      );
    }

    await prisma.prediction.deleteMany({
      where: { gpId },
    });

    await prisma.grandPrix.delete({
      where: { id: gpId },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/gp/[id] error", err);
    return NextResponse.json(
      {
        error: "Errore durante la cancellazione del GP",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
