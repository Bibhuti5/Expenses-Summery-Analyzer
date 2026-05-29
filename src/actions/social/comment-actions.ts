"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import type { CommentWithAuthor } from "@/lib/types/social"

export async function createComment(data: {
  postId: string
  content: string
}): Promise<{ success: boolean; comment?: CommentWithAuthor; error?: string }> {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated" }

  if (!data.content.trim()) return { success: false, error: "Comment cannot be empty" }

  const post = await prisma.post.findUnique({
    where: { id: data.postId },
    select: { authorId: true },
  })
  if (!post) return { success: false, error: "Post not found" }

  const comment = await prisma.comment.create({
    data: {
      content: data.content.trim(),
      postId: data.postId,
      authorId: session.userId,
    },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  })

  // Notify post author (skip self-notification)
  if (post.authorId !== session.userId) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        triggeredById: session.userId,
        type: "COMMENT",
        postId: data.postId,
      },
    })
  }

  return { success: true, comment }
}

export async function getComments(postId: string): Promise<CommentWithAuthor[]> {
  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  })
  return comments
}
