"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import type { NotificationWithMeta } from "@/lib/types/social"

export async function getNotifications(): Promise<NotificationWithMeta[]> {
  const session = await getSession()
  if (!session) return []

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      triggeredBy: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  })

  return notifications.map((n) => ({
    id: n.id,
    type: n.type as any,
    read: n.read,
    createdAt: n.createdAt,
    postId: n.postId,
    triggeredBy: n.triggeredBy,
  }))
}

export async function markNotificationsRead(): Promise<void> {
  const session = await getSession()
  if (!session) return

  await prisma.notification.updateMany({
    where: { userId: session.userId, read: false },
    data: { read: true },
  })
}

export async function getUnreadNotificationCount(): Promise<number> {
  const session = await getSession()
  if (!session) return 0

  return prisma.notification.count({
    where: { userId: session.userId, read: false },
  })
}
