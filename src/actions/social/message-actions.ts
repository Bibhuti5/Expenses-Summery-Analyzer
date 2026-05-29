"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import type { MessageWithSender, ConversationSummary } from "@/lib/types/social"

export async function sendMessage(data: {
  receiverId: string
  content: string
}): Promise<{ success: boolean; message?: MessageWithSender; error?: string }> {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated" }
  if (!data.content.trim()) return { success: false, error: "Message cannot be empty" }

  const message = await prisma.message.create({
    data: {
      senderId: session.userId,
      receiverId: data.receiverId,
      content: data.content.trim(),
    },
  })

  return {
    success: true,
    message: {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      senderId: message.senderId,
      receiverId: message.receiverId,
    },
  }
}

export async function getConversations(): Promise<ConversationSummary[]> {
  const session = await getSession()
  if (!session) return []

  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: session.userId }, { receiverId: session.userId }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  })

  const conversationMap = new Map<string, ConversationSummary>()

  for (const msg of messages) {
    const otherUser = msg.senderId === session.userId ? msg.receiver : msg.sender
    if (conversationMap.has(otherUser.id)) continue

    const unreadCount = await prisma.message.count({
      where: {
        senderId: otherUser.id,
        receiverId: session.userId,
        read: false,
      },
    })

    conversationMap.set(otherUser.id, {
      otherUser,
      lastMessage: msg.content,
      lastMessageAt: msg.createdAt,
      unreadCount,
    })
  }

  return Array.from(conversationMap.values())
}

export async function getMessages(
  otherUserId: string,
  cursor?: string
): Promise<{ messages: MessageWithSender[]; nextCursor?: string }> {
  const session = await getSession()
  if (!session) return { messages: [] }

  const limit = 30
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: session.userId },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasMore = messages.length > limit
  const items = (hasMore ? messages.slice(0, limit) : messages).reverse()

  return {
    messages: items.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      senderId: m.senderId,
      receiverId: m.receiverId,
    })),
    nextCursor: hasMore ? items[0].id : undefined,
  }
}

export async function getOtherUserById(userId: string): Promise<{
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
} | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  })
}

export async function markMessagesRead(otherUserId: string): Promise<void> {
  const session = await getSession()
  if (!session) return

  await prisma.message.updateMany({
    where: { senderId: otherUserId, receiverId: session.userId, read: false },
    data: { read: true },
  })
}
