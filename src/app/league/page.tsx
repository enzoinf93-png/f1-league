'use client'

import { useEffect, useState } from 'react'

type User = {
  id: string
  email: string
  name: string
  isAdmin: boolean
  leagueId: string
}

type GrandPrix = {
  id: string
  name: string
  roundNumber: number
  fp1StartUtc: string
  qualiStartUtc: string
  raceStartUtc: string
}

type PredictionType =
  | 'giro_veloce'
  | 'pole'
  | 'vincitore'
  | 'top_5'
  | 'podio'
  | 'safety_car'
  | 'bandiera_rossa'

type PredictionSlot = {
  type: PredictionType
  text: string
}

export default function LeaguePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [gps, setGps] = useState<GrandPrix[]>([])
  const [form, setForm] = useState({
    name: '',
    roundNumber: '',
    fp1: '',
    quali: '',
    race: '',
  })

  // 🔽 stati per le MIE previsioni
  const [selectedGp, setSelectedGp] = useState<GrandPrix | null>(null)
  const [predictions, setPredictions] = useState<PredictionSlot[]>(
    Array(6)
      .fill(null)
      .map(() => ({
        type: 'vincitore',
        text: '',
      })),
  )
  const [predictionError, setPredictionError] = useState<string | null>(null)
  const [predictionSuccess, setPredictionSuccess] = useState<string | null>(null)

  // 🔽 stati per PREVISIONI AMICI
  const [viewGp, setViewGp] = useState<GrandPrix | null>(null)
  const [friendsPredictions, setFriendsPredictions] = useState<any[]>([])
  const [friendsLoading, setFriendsLoading] = useState(false)

  // Carica utente + GP
  useEffect(() => {
    const load = async () => {
      const meRes = await fetch('/api/auth/me')
      const meData = await meRes.json()
      setUser(meData.user)

      if (meData.user) {
        const gpRes = await fetch('/api/gp')
        const gpData = await gpRes.json()
        setGps(gpData)
      }

      setLoading(false)
    }
    load()
  }, [])

  // 🔽 apre pannello MIE previsioni
  const openPredictions = async (gp: GrandPrix) => {
    setSelectedGp(gp)
    setPredictionError(null)
    setPredictionSuccess(null)

    const res = await fetch(`/api/gp/${gp.id}/prediction`)
    const data = await res.json()

    const slots: PredictionSlot[] = Array(6)
      .fill(null)
      .map(() => ({ type: 'vincitore', text: '' }))

    data.forEach((p: any, idx: number) => {
      if (idx < 6) {
        slots[idx] = {
          type: (p.type as PredictionType) || 'vincitore',
          text: p.payload?.text || '',
        }
      }
    })

    setPredictions(slots)
  }

  // 🔽 salva MIE previsioni
  const savePredictions = async () => {
    if (!selectedGp) return
    setPredictionError(null)
    setPredictionSuccess(null)

    try {
      for (let i = 0; i < predictions.length; i++) {
        const { type, text } = predictions[i]
        const trimmed = text.trim()
        if (!trimmed) continue

        const res = await fetch(`/api/gp/${selectedGp.id}/prediction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type, // es. "pole", "podio", ...
            payload: { text: trimmed },
          }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Errore salvataggio')
        }
      }

      setPredictionSuccess('Previsioni salvate!')
    } catch (e: any) {
      setPredictionError(e.message || 'Errore')
    }
  }

  // 🔽 apre pannello PREVISIONI AMICI
  const openFriendsPredictions = async (gp: GrandPrix) => {
    setViewGp(gp)
    setFriendsLoading(true)
    setFriendsPredictions([])

    try {
      const res = await fetch(`/api/gp/${gp.id}/prediction/all`)
      const data = await res.json()
      if (!res.ok) {
        console.error('Errore friends', data)
        return
      }
      setFriendsPredictions(data.predictions || [])
    } finally {
      setFriendsLoading(false)
    }
  }

  const handleCreateGp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.isAdmin) return

    const res = await fetch('/api/gp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        roundNumber: Number(form.roundNumber),
        fp1StartUtc: form.fp1,
        qualiStartUtc: form.quali,
        raceStartUtc: form.race,
      }),
    })

    if (!res.ok) {
      alert('Errore creazione GP')
      return
    }

    const gpRes = await fetch('/api/gp')
    const gpData = await gpRes.json()
    setGps(gpData)
    setForm({ name: '', roundNumber: '', fp1: '', quali: '', race: '' })
  }

  if (loading) {
    return <div className="p-8 text-white">Caricamento...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="bg-white p-6 rounded-xl shadow">
          <p>Non sei loggato. Torna alla home e fai login.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🏁 F1 League</h1>
            <p className="text-sm text-slate-300">
              Ciao {user.name} ({user.email}) {user.isAdmin && '– Admin'}
            </p>
          </div>
        </header>

        {user.isAdmin && (
          <section className="bg-slate-800 p-4 rounded-xl">
            <h2 className="font-semibold mb-3">Crea nuovo GP</h2>
            <form
              onSubmit={handleCreateGp}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <input
                className="p-2 rounded bg-slate-900 border border-slate-700"
                placeholder="Nome GP (es. Bahrain)"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
              <input
                type="number"
                className="p-2 rounded bg-slate-900 border border-slate-700"
                placeholder="Round"
                value={form.roundNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, roundNumber: e.target.value }))
                }
                required
              />
              <label className="text-xs text-slate-300">
                FP1
                <input
                  type="datetime-local"
                  className="mt-1 w-full p-2 rounded bg-slate-900 border border-slate-700"
                  value={form.fp1}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fp1: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="text-xs text-slate-300">
                Qualifiche
                <input
                  type="datetime-local"
                  className="mt-1 w-full p-2 rounded bg-slate-900 border border-slate-700"
                  value={form.quali}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quali: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="text-xs text-slate-300 md:col-span-2">
                Gara
                <input
                  type="datetime-local"
                  className="mt-1 w-full p-2 rounded bg-slate-900 border border-slate-700"
                  value={form.race}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, race: e.target.value }))
                  }
                  required
                />
              </label>
              <button
                type="submit"
                className="md:col-span-2 bg-green-600 hover:bg-green-700 py-2 rounded font-semibold"
              >
                Salva GP
              </button>
            </form>
          </section>
        )}

        <section className="bg-slate-800 p-4 rounded-xl">
          <h2 className="font-semibold mb-3">Calendario GP</h2>
          {gps.length === 0 && (
            <p className="text-sm text-slate-300">
              Nessun GP ancora creato. {user.isAdmin ? 'Crea il primo!' : ''}
            </p>
          )}
          <div className="space-y-3">
            {gps.map((gp) => (
              <div
                key={gp.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between border border-slate-700 rounded-lg p-3"
              >
                <div>
                  <p className="font-semibold">
                    Round {gp.roundNumber} – {gp.name}
                  </p>
                  <p className="text-xs text-slate-300">
                    Qualifiche:{' '}
                    {new Date(gp.qualiStartUtc).toLocaleString('it-IT')}
                  </p>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <button
                    onClick={() => openPredictions(gp)}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                  >
                    Fai le previsioni
                  </button>
                  <button
                    onClick={() => openFriendsPredictions(gp)}
                    className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm"
                  >
                    Vedi amici
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 🔽 pannello PREVISIONI AMICI */}
        {viewGp && (
          <section className="bg-slate-800 p-4 rounded-xl mt-6">
            <h2 className="font-semibold mb-2">
              Previsioni amici – Round {viewGp.roundNumber} – {viewGp.name}
            </h2>
            {friendsLoading && (
              <p className="text-sm text-slate-300">
                Caricamento previsioni...
              </p>
            )}

            {!friendsLoading && friendsPredictions.length === 0 && (
              <p className="text-sm text-slate-300">
                Nessuna previsione ancora per questo GP.
              </p>
            )}

            {!friendsLoading && friendsPredictions.length > 0 && (
              <div className="mt-2 space-y-2">
                {friendsPredictions.map((p: any) => (
                  <div
                    key={p.id}
                    className="border border-slate-700 rounded-lg p-2 text-sm"
                  >
                    <p className="font-semibold">
                      {p.user.name || p.user.email}
                    </p>
                    <p className="text-slate-300">
                      {p.type}: {p.payload?.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 🔽 pannello MIE PREVISIONI */}
        {selectedGp && (
          <section className="bg-slate-800 p-4 rounded-xl mt-6">
            <h2 className="font-semibold mb-2">
              Previsioni – Round {selectedGp.roundNumber} – {selectedGp.name}
            </h2>
            <p className="text-xs text-slate-300 mb-3">
              Puoi inserire fino a 6 previsioni (es. pole, top3, vincitore,
              giro veloce...). Le previsioni si chiudono 10 minuti prima
              dell&apos;inizio delle qualifiche.
            </p>

            {predictionError && (
              <p className="text-sm text-red-400 mb-2">{predictionError}</p>
            )}
            {predictionSuccess && (
              <p className="text-sm text-green-400 mb-2">
                {predictionSuccess}
              </p>
            )}

            <div className="space-y-2">
              {predictions.map((slot, idx) => (
                <div
                  key={idx}
                  className="flex flex-col md:flex-row gap-2 items-stretch"
                >
                  <span className="w-6 text-sm text-slate-300 flex items-center">
                    {idx + 1}.
                  </span>

                  <select
                    className="md:w-40 p-2 rounded bg-slate-900 border border-slate-700 text-sm"
                    value={slot.type}
                    onChange={(e) => {
                      const copy = [...predictions]
                      copy[idx] = {
                        ...copy[idx],
                        type: e.target.value as PredictionType,
                      }
                      setPredictions(copy)
                    }}
                  >
                    <option value="giro_veloce">Giro veloce</option>
                    <option value="pole">Pole</option>
                    <option value="vincitore">Vincitore</option>
                    <option value="top_5">Top 5</option>
                    <option value="podio">Podio</option>
                    <option value="safety_car">Safety car</option>
                    <option value="bandiera_rossa">Bandiera rossa</option>
                  </select>

                  <input
                    className="flex-1 p-2 rounded bg-slate-900 border border-slate-700 text-sm"
                    placeholder="Es. VER, LEC, RUS..."
                    value={slot.text}
                    onChange={(e) => {
                      const copy = [...predictions]
                      copy[idx] = { ...copy[idx], text: e.target.value }
                      setPredictions(copy)
                    }}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={savePredictions}
              className="mt-3 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm font-semibold"
            >
              Salva previsioni
            </button>
          </section>
        )}
      </div>
    </div>
  )
}
