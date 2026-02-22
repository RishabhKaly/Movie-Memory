"use client"

import { signIn } from "next-auth/react"

export function SignInButton() {
  return (
    <button
      onClick={() => signIn("google")}
      className="px-4 py-2 bg-black text-white rounded"
    >
      Sign in with Google
    </button>
  )
}