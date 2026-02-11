// src/pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Endpoint temporaneo per evitare errori in build su /api/auth/login
  // TODO: collegare qui la logica di login reale oppure rimuovere i riferimenti a /api/auth/login
  return res.status(200).json({ ok: true });
}
