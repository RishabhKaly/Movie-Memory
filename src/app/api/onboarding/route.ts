import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const body = await req.json()
  let movie = body.movie?.trim()

  //  Server side validation
  if (!movie || movie.length < 2) {
    return NextResponse.json(
      { error: "Movie name too short" },
      { status: 400 }
    )
  }

  if (movie.length > 100) {
    return NextResponse.json(
      { error: "Movie name too long" },
      { status: 400 }
    )
  }

  await prisma.user.update({
    where: { email: session.user.email },
    data: { favoriteMovie: movie },
  })

  return NextResponse.json({ success: true })
}