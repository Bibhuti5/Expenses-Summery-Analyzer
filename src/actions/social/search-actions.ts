"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import type { UserSummary, PostWithMeta } from "@/lib/types/social"

const postInclude = {
  author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  likes: { select: { userId: true } },
  comments: { select: { id: true } },
  postHashtags: { include: { hashtag: true } },
}

function mapPost(p: any, currentUserId: string | null): PostWithMeta {
  return {
    id: p.id,
    content: p.content,
    imageUrl: p.imageUrl,
    isModerated: p.isModerated,
    moderationNote: p.moderationNote,
    createdAt: p.createdAt,
    author: p.author,
    likeCount: p.likes.length,
    commentCount: p.comments.length,
    isLikedByCurrentUser: currentUserId
      ? p.likes.some((l: any) => l.userId === currentUserId)
      : false,
    hashtags: p.postHashtags.map((ph: any) => ph.hashtag.name),
  }
}

export async function searchUsers(query: string): Promise<UserSummary[]> {
  const session = await getSession()
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: query } },
        { displayName: { contains: query } },
      ],
    },
    take: 20,
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  })

  const myFollowing = session
    ? await prisma.follow
        .findMany({ where: { followerId: session.userId }, select: { followingId: true } })
        .then((rows) => new Set(rows.map((r) => r.followingId)))
    : new Set<string>()

  return users.map((u) => ({ ...u, isFollowing: myFollowing.has(u.id) }))
}

export async function searchPosts(query: string): Promise<PostWithMeta[]> {
  const session = await getSession()
  const posts = await prisma.post.findMany({
    where: { content: { contains: query } },
    take: 20,
    orderBy: { createdAt: "desc" },
    include: postInclude,
  })
  return posts.map((p) => mapPost(p, session?.userId ?? null))
}

export async function getTrendingHashtags(
  limit = 10
): Promise<{ name: string; count: number }[]> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const results = await prisma.postHashtag.groupBy({
    by: ["hashtagId"],
    where: { post: { createdAt: { gte: since } } },
    _count: { hashtagId: true },
    orderBy: { _count: { hashtagId: "desc" } },
    take: limit,
  })

  const hashtagIds = results.map((r) => r.hashtagId)
  const hashtags = await prisma.hashtag.findMany({ where: { id: { in: hashtagIds } } })
  const hashtagMap = new Map(hashtags.map((h) => [h.id, h.name]))

  return results.map((r) => ({
    name: hashtagMap.get(r.hashtagId) ?? "",
    count: r._count.hashtagId,
  }))
}

export async function getHashtagPosts(
  tag: string,
  cursor?: string
): Promise<{ posts: PostWithMeta[]; nextCursor?: string }> {
  const session = await getSession()
  const limit = 20

  const hashtag = await prisma.hashtag.findUnique({ where: { name: tag.toLowerCase() } })
  if (!hashtag) return { posts: [] }

  const postHashtags = await prisma.postHashtag.findMany({
    where: { hashtagId: hashtag.id },
    select: { postId: true },
  })
  const postIds = postHashtags.map((ph) => ph.postId)

  const posts = await prisma.post.findMany({
    where: { id: { in: postIds } },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: postInclude,
  })

  const hasMore = posts.length > limit
  const items = hasMore ? posts.slice(0, limit) : posts

  return {
    posts: items.map((p) => mapPost(p, session?.userId ?? null)),
    nextCursor: hasMore ? items[items.length - 1].id : undefined,
  }
}
