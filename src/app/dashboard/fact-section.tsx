"use client"

import { useState } from "react"

export default function FactSection() {
  const [fact, setFact] = useState("")
  const [loading, setLoading] = useState(false)

  async function generateFact() {
    setLoading(true)

    const res = await fetch("/api/fact", { method: "POST" })
    const data = await res.json()

    if (data.fact) {
      setFact(data.fact)
    }

    setLoading(false)
  }

  return (
    <div className="mt-6">
      <button
        onClick={generateFact}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Generating..." : "Generate Fun Fact"}
      </button>

      {fact && (
        <p className="mt-4 p-4 bg-purple-300 rounded">
          {fact}
        </p>
      )}
    </div>
  )
}