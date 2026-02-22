
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })
  

  if (!user?.favoriteMovie) {
    return NextResponse.json(
      { error: "No favorite movie set" },
      { status: 400 }
    )
  }

  //  Get most recent fact for this user
  const latestFact = await prisma.fact.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })

  const now = new Date()

  if (latestFact) {
    const ageInSeconds =
      (now.getTime() - latestFact.createdAt.getTime()) / 1000

    //   If < 60 seconds old  return cached
    if (ageInSeconds < 60) {
      return NextResponse.json({
        fact: latestFact.content,
        cached: true,
      })
    }
  }

  
  //  Generate new fact
let fact: string | null = null

try {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Give me one short fun fact about the movie "${user.favoriteMovie}".`,
      },
    ],
  })

  fact = completion.choices[0].message.content?.trim() || null
} catch (error) {
  console.error("OpenAI error:", error)

  //  Fallback to most recent cached fact
  const fallbackFact = await prisma.fact.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })

  if (fallbackFact) {
    return NextResponse.json({
      fact: fallbackFact.content,
      cached: true,
      fallback: true,
    })
  }

  //  No cached fact exists
  return NextResponse.json(
    {
      error:
        "Movie Memory couldn't generate a new fact right now. Please try again in a moment.",
    },
    { status: 503 }
  )
}

  if (!fact) {
    return NextResponse.json(
      { error: "No fact generated" },
      { status: 500 }
    )
  }
  //  60 second window calculation
  const windowStart: Date = new Date(
    Math.floor(Date.now() / 60000) * 60000
  )

  //  STEP 4: Store new fact
  await prisma.fact.create({
    data: {
      content: fact,
      userId: user.id,
      windowStart,
    },
  })

  return NextResponse.json({
    fact,
    cached: false,
  })
}