import Image from "next/image";

export default function Home() {
  const params = new URLSearchParams(
    typeof window === 'undefined' ? '' : window.location.search
  )
  const error = params.get('error')

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">🏁 F1 League</h1>

        {error && (
          <p className="mb-4 text-sm text-red-600 text-center">
            Credenziali non valide
          </p>
        )}

        <form action="/api/auth/login" method="POST" className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="w-full p-3 border rounded-lg"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            className="w-full p-3 border rounded-lg"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Entra
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-500 text-center">
          Admin: admin@f1league.it / admin123
        </p>
      </div>
    </div>
  )
}
