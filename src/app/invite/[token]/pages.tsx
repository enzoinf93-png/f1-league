"use client";

import { useEffect, useState } from "react";

export default function InvitePage({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const joinLeague = async () => {
      try {
        const res = await fetch("/api/invite/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: params.token }),
        });

        const data = await res.json();

        if (res.status === 401) {
          window.location.href = `/login?redirect=/invite/${params.token}`;
          return;
        }

        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "Errore nell'unirsi alla league");
          return;
        }

        setStatus("ok");
        setMessage("Ti sei unito alla league!");
        if (data.leagueId) {
          window.location.href = `/leagues/${data.leagueId}`;
        }
      } catch (e) {
        setStatus("error");
        setMessage("Errore imprevisto");
      }
    };

    joinLeague();
  }, [params.token]);

  return (
    <div className="p-4">
      {status === "loading" && <p>Stiamo elaborando l'invito…</p>}
      {status !== "loading" && <p>{message}</p>}
    </div>
  );
}
