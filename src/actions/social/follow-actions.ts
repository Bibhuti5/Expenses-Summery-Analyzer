"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import type { UserSummary } from "@/lib/types/social"

export async function toggleFollow(targetUserId: string): Promise<{ following: boolean }> {
  const session = await getSession()
  if (!session) throw new Error("Not authenticated")
  if (session.userId === targetUserId) throw new Error("Cannot follow yourself")

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: session.userId, followingId: targetUserId } },
  })

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } })
    return { following: false }
  }

  await prisma.follow.create({
    data: { followerId: session.userId, followingId: targetUserId },
  })

  await prisma.notification.create({
    data: {
      userId: targetUserId,
      triggeredById: session.userId,
      type: "FOLLOW",
    },
  })

  return { following: true }
}

export async function getSuggestedUsers(limit = 5): Promise<UserSummary[]> {
  const session = await getSession()

  const alreadyFollowing = session
    ? await prisma.follow
        .findMany({ where: { followerId: session.userId }, select: { followingId: true } })
        .then((rows) => rows.map((r) => r.followingId))
    : []

  const excludeIds = session ? [...alreadyFollowing, session.userId] : alreadyFollowing

  const users = await prisma.user.findMany({
    where: excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {},
    take: limit,
    select: { id: true, username: true, displayName: true, avatarUrl: true, followers: true },
    orderBy: { followers: { _count: "desc" } },
  })

  return users.map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    followerCount: u.followers.length,
    isFollowing: false,
  }))
}

export async function getFollowers(userId: string): Promise<UserSummary[]> {
  const session = await getSession()
  const follows = await prisma.follow.findMany({
    where: { followingId: userId },
    include: { follower: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
  })

  const myFollowing = session
    ? await prisma.follow
        .findMany({ where: { followerId: session.userId }, select: { followingId: true } })
        .then((rows) => new Set(rows.map((r) => r.followingId)))
    : new Set<string>()

  return follows.map((f) => ({
    ...f.follower,
    isFollowing: myFollowing.has(f.follower.id),
  }))
}

export async function getFollowing(userId: string): Promise<UserSummary[]> {
  const session = await getSession()
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    include: { following: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
  })

  const myFollowing = session
    ? await prisma.follow
        .findMany({ where: { followerId: session.userId }, select: { followingId: true } })
        .then((rows) => new Set(rows.map((r) => r.followingId)))
    : new Set<string>()

  return follows.map((f) => ({
    ...f.following,
    isFollowing: myFollowing.has(f.following.id),
  }))
}
