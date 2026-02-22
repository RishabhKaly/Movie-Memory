"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function OnboardingForm() {
  const [movie, setMovie] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movie }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error)
      return
    }

    router.refresh()
  }

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold mb-4">
        What's your favorite movie?
      </h1>

      <form onSubmit={handleSubmit}>
        <input
          value={movie}
          onChange={(e) => setMovie(e.target.value)}
          className="border p-2 mr-2"
          placeholder="Enter movie name"
        />
        <button className="bg-black text-white px-4 py-2">
          Save
        </button>
      </form>

      {error && <p className="text-red-500 mt-2">{error}</p>}
    </main>
  )
}