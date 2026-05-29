"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import type { UserProfile, PostWithMeta, UserSummary } from "@/lib/types/social"

export async function getUserProfile(username: string): Promise<{
  user: UserProfile
  postCount: number
  followerCount: number
  followingCount: number
  isFollowing: boolean
  isOwnProfile: boolean
} | null> {
  const session = await getSession()

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
    },
  })

  if (!user) return null

  const [postCount, followerCount, followingCount, followRecord] = await Promise.all([
    prisma.post.count({ where: { authorId: user.id } }),
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    session
      ? prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: session.userId,
              followingId: user.id,
            },
          },
        })
      : null,
  ])

  return {
    user,
    postCount,
    followerCount,
    followingCount,
    isFollowing: !!followRecord,
    isOwnProfile: session?.userId === user.id,
  }
}

export async function getUserPosts(
  userId: string,
  cursor?: string
): Promise<{ posts: PostWithMeta[]; nextCursor?: string }> {
  const session = await getSession()
  const limit = 20

  const posts = await prisma.post.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      likes: { select: { userId: true } },
      comments: { select: { id: true } },
      postHashtags: { include: { hashtag: true } },
    },
  })

  const hasMore = posts.length > limit
  const items = hasMore ? posts.slice(0, limit) : posts

  return {
    posts: items.map((p) => ({
      id: p.id,
      content: p.content,
      imageUrl: p.imageUrl,
      isModerated: p.isModerated,
      moderationNote: p.moderationNote,
      createdAt: p.createdAt,
      author: p.author,
      likeCount: p.likes.length,
      commentCount: p.comments.length,
      isLikedByCurrentUser: session
        ? p.likes.some((l) => l.userId === session.userId)
        : false,
      hashtags: p.postHashtags.map((ph) => ph.hashtag.name),
    })),
    nextCursor: hasMore ? items[items.length - 1].id : undefined,
  }
}

export async function updateProfile(data: {
  username?: string
  displayName?: string
  bio?: string
  avatarUrl?: string
}): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated" }

  if (data.username) {
    const existing = await prisma.user.findFirst({
      where: { username: data.username, NOT: { id: session.userId } },
    })
    if (existing) return { success: false, error: "Username already taken" }
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      ...(data.username !== undefined && { username: data.username }),
      ...(data.displayName !== undefined && { displayName: data.displayName }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
    },
  })

  return { success: true }
}

export async function getCurrentUserProfile(): Promise<UserSummary | null> {
  const session = await getSession()
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  })

  return user
}
