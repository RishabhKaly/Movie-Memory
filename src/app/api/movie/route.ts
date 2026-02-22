import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
// import { authOptions } from "../../auth/[...nextauth]/route"
import { z } from "zod"
// import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const schema = z.object({
  movie: z.string().trim().min(1).max(100),
})

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid movie" }, { status: 400 })
  }

  await prisma.user.update({
    where: { email: session.user.email },
    data: { favoriteMovie: parsed.data.movie },
  })

  return NextResponse.json({ success: true })
}