import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Image from "next/image"
import LogoutButton from "./logout-button"
import FactSection from "./fact-section"
export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  // 🔒 Protect route
  if (!session?.user?.email) {
    redirect("/")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    redirect("/")
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-slate-100 shadow-md rounded-lg p-8 w-full max-w-md text-center">
        
        {/* User Photo */}
        {session.user.image && (
          <Image
            src={session.user.image}
            alt="Profile"
            width={100}
            height={100}
            className="rounded-full mx-auto mb-4"
          />
        )}

        {/* Name */}
        <h1 className="text-2xl  font-bold text-black 500">
          {session.user.name}
        </h1>

        {/* Email */}
        <p className="text-blue-600 mb-4">
          {session.user.email}
        </p>

        {/* Favorite Movie */}
        <div className="mt-4 p-4 bg-gray-200 rounded text-black 500">
          <p className="font-semibold">Favorite Movie</p>
          <p>{user.favoriteMovie ?? "Not set"}</p>
        </div>
        <FactSection />

        {/* Logout */}
        <div className="mt-6">
          <LogoutButton />
        </div>

      </div>
    </main>
  )
}

