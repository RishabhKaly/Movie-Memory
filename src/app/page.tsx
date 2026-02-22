import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "./api/auth/[...nextauth]/route"
import { SignInButton } from "@/components/SignInButton"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignInButton />
    </main>
  )
}