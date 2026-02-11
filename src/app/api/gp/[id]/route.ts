import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function getUserFromRequest(req: Request) {
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
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return payload;
  } catch {
    return null;
  }
}

// DELETE /api/gp/[id]  -> elimina un GP (solo admin)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = getUserFromRequest(req);
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const gpId = params.id;

    // Prima cancella tutte le previsioni collegate a questo GP
    await prisma.prediction.deleteMany({
      where: { gpId },
    });

    // Poi cancella il GP
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
