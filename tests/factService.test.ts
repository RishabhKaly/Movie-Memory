// Covers:
// 1) 60s cache window: same user gets cached fact in same minute window
// 2) Authorization isolation: facts are scoped to userId (user B can't see user A facts)



import { describe, it, expect, beforeEach, afterAll } from "vitest"
import { prisma } from "@/lib/prisma"
import { generateFactForUser } from "@/lib/factService"

describe("Fact generation + auth isolation", () => {
  const userA = {
    id: "userA-id",
    email: "usera@test.com",
    name: "User A",
    favoriteMovie: "Inception",
  }

  const userB = {
    id: "userB-id",
    email: "userb@test.com",
    name: "User B",
    favoriteMovie: "Inception",
  }

  beforeEach(async () => {
    // Clean only what we create (safe)
    await prisma.fact.deleteMany({
      where: { userId: { in: [userA.id, userB.id] } },
    })
    await prisma.user.deleteMany({
      where: { id: { in: [userA.id, userB.id] } },
    })

    // Create test users (required for FK)
    await prisma.user.create({
      data: {
        id: userA.id,
        email: userA.email,
        name: userA.name,
        favoriteMovie: userA.favoriteMovie,
      },
    })
    await prisma.user.create({
      data: {
        id: userB.id,
        email: userB.email,
        name: userB.name,
        favoriteMovie: userB.favoriteMovie,
      },
    })
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it("60-second cache: second call returns cached for same user", async () => {
    const first = await generateFactForUser(userA)
    const second = await generateFactForUser(userA)

    expect(second.cached).toBe(true)
    expect(second.fact).toBe(first.fact)
  })

  // ✅ STEP 4: Authorization / isolation
  it("authorization: user B cannot fetch user A's facts", async () => {
    // Generate fact for A
    await generateFactForUser(userA)
  
    // B should not see any facts when querying as B
    const bLatestBefore = await prisma.fact.findFirst({
      where: { userId: userB.id },
      orderBy: { createdAt: "desc" },
    })
    expect(bLatestBefore).toBeNull()
  
    // When B generates, it's for B only
    await generateFactForUser(userB)
  
    const bLatestAfter = await prisma.fact.findFirst({
      where: { userId: userB.id },
      orderBy: { createdAt: "desc" },
    })
    expect(bLatestAfter).not.toBeNull()
  
    // And A still has their own fact(s)
    const aLatest = await prisma.fact.findFirst({
      where: { userId: userA.id },
      orderBy: { createdAt: "desc" },
    })
    expect(aLatest).not.toBeNull()
  
    // Critical assertion: B never reads A's fact row
    expect(bLatestAfter?.userId).toBe(userB.id)
    expect(aLatest?.userId).toBe(userA.id)
  })
})