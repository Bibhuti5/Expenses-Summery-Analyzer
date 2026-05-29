"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import type { PostWithMeta } from "@/lib/types/social"

const HASHTAG_RE = /\B#(\w+)/g

async function extractAndUpsertHashtags(postId: string, content: string) {
  const tags = [...new Set(Array.from(content.matchAll(HASHTAG_RE), (m) => m[1].toLowerCase()))]
  for (const name of tags) {
    const hashtag = await prisma.hashtag.upsert({
      where: { name },
      create: { name },
      update: {},
    })
    await prisma.postHashtag.upsert({
      where: { postId_hashtagId: { postId, hashtagId: hashtag.id } },
      create: { postId, hashtagId: hashtag.id },
      update: {},
    })
  }
}

function mapPost(
  p: any,
  currentUserId: string | null
): PostWithMeta {
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

const postInclude = {
  author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  likes: { select: { userId: true } },
  comments: { select: { id: true } },
  postHashtags: { include: { hashtag: true } },
}

export async function createPost(data: {
  content: string
  imageUrl?: string
}): Promise<{ success: boolean; post?: PostWithMeta; error?: string }> {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated" }

  if (!data.content.trim()) return { success: false, error: "Content is required" }
  if (data.content.length > 280) return { success: false, error: "Post exceeds 280 characters" }

  const post = await prisma.post.create({
    data: {
      content: data.content.trim(),
      imageUrl: data.imageUrl || null,
      authorId: session.userId,
    },
    include: postInclude,
  })

  await extractAndUpsertHashtags(post.id, post.content)

  // Fire-and-forget AI moderation
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
  fetch(`${baseUrl}/api/social/moderate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-moderation-secret": process.env.MODERATION_SECRET || "",
    },
    body: JSON.stringify({ postId: post.id, content: post.content }),
  }).catch(() => {})

  const freshPost = await prisma.post.findUnique({
    where: { id: post.id },
    include: postInclude,
  })

  return { success: true, post: mapPost(freshPost, session.userId) }
}

export async function deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated" }

  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) return { success: false, error: "Post not found" }
  if (post.authorId !== session.userId) return { success: false, error: "Unauthorized" }

  await prisma.post.delete({ where: { id: postId } })
  return { success: true }
}

export async function getFeedPosts(opts: {
  cursor?: string
  limit?: number
  mode: "chronological" | "algorithmic"
}): Promise<{ posts: PostWithMeta[]; nextCursor?: string }> {
  const session = await getSession()
  const limit = opts.limit ?? 20

  let followedIds: string[] = []
  if (session) {
    const follows = await prisma.follow.findMany({
      where: { followerId: session.userId },
      select: { followingId: true },
    })
    followedIds = follows.map((f) => f.followingId)
  }

  const whereClause = followedIds.length > 0
    ? { authorId: { in: [...followedIds, session!.userId] } }
    : {}

  let posts: any[]

  if (opts.mode === "algorithmic" && followedIds.length > 0) {
    // Use raw SQL for scored ranking
    const cursorClause = opts.cursor ? `AND p.id < '${opts.cursor}'` : ""
    const authorIds = [...followedIds, session!.userId].map((id) => `'${id}'`).join(",")
    posts = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        p.id, p.content, p."imageUrl", p."isModerated", p."moderationNote", p."createdAt", p."updatedAt", p."authorId",
        (SELECT COUNT(*) FROM "Like" l WHERE l."postId" = p.id) * 2 +
        (SELECT COUNT(*) FROM "Comment" c WHERE c."postId" = p.id) AS score
      FROM "Post" p
      WHERE p."authorId" IN (${authorIds}) ${cursorClause}
      ORDER BY score DESC, p."createdAt" DESC
      LIMIT ${limit + 1}
    `)
  } else {
    posts = await prisma.post.findMany({
      where: followedIds.length > 0 ? whereClause : {},
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
      include: postInclude,
    })
    const hasMore = posts.length > limit
    const items = hasMore ? posts.slice(0, limit) : posts
    return {
      posts: items.map((p) => mapPost(p, session?.userId ?? null)),
      nextCursor: hasMore ? items[items.length - 1].id : undefined,
    }
  }

  // For raw query results, fetch full posts with includes
  const hasMore = posts.length > limit
  const postIds = (hasMore ? posts.slice(0, limit) : posts).map((p: any) => p.id)

  const fullPosts = await prisma.post.findMany({
    where: { id: { in: postIds } },
    include: postInclude,
  })

  // Preserve score ordering
  const ordered = postIds.map((id) => fullPosts.find((p) => p.id === id)!).filter(Boolean)

  return {
    posts: ordered.map((p) => mapPost(p, session?.userId ?? null)),
    nextCursor: hasMore ? postIds[postIds.length - 1] : undefined,
  }
}
