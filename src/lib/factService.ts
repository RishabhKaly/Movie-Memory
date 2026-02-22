import { prisma } from "@/lib/prisma"
import OpenAI from "openai"
import { Prisma } from "@prisma/client"

export async function generateFactForUser(user: any) {
  const windowStart = new Date(
    Math.floor(Date.now() / 60000) * 60000
  )

  const existingFact = await prisma.fact.findUnique({
    where: {
      userId_windowStart: {
        userId: user.id,
        windowStart,
      },
    },
  })

  if (existingFact) {
    return { fact: existingFact.content, cached: true }
  }

  // You can mock OpenAI in tests
  const fact = "Test Fact"

  try {
    await prisma.fact.create({
      data: {
        content: fact,
        userId: user.id,
        windowStart,
      },
    })

    return { fact, cached: false }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const raceWinner = await prisma.fact.findUnique({
        where: {
          userId_windowStart: {
            userId: user.id,
            windowStart,
          },
        },
      })

      return { fact: raceWinner?.content, cached: true }
    }

    throw error
  }
}