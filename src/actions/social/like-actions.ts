"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function toggleLike(postId: string): Promise<{
  liked: boolean
  likeCount: number
}> {
  const session = await getSession()
  if (!session) throw new Error("Not authenticated")

  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId: session.userId } },
  })

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } })

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } })
  } else {
    await prisma.like.create({ data: { postId, userId: session.userId } })
    // Notify post author (skip self-notification)
    if (post && post.authorId !== session.userId) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          triggeredById: session.userId,
          type: "LIKE",
          postId,
        },
      })
    }
  }

  const likeCount = await prisma.like.count({ where: { postId } })
  return { liked: !existing, likeCount }
}
