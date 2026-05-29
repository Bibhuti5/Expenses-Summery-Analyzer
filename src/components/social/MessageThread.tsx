"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { UserAvatar } from "./UserAvatar"
import { formatDistanceToNow } from "@/lib/format-date"
import { getMessages, markMessagesRead } from "@/actions/social/message-actions"
import { cn } from "@/lib/utils"
import type { MessageWithSender, UserSummary } from "@/lib/types/social"

interface MessageThreadProps {
  otherUser: UserSummary
  currentUserId: string
  initialMessages: MessageWithSender[]
}

export function MessageThread({ otherUser, currentUserId, initialMessages }: MessageThreadProps) {
  const [messages, setMessages] = useState(initialMessages)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    markMessagesRead(otherUser.id)
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  // Poll for new messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(async () => {
        const result = await getMessages(otherUser.id)
        setMessages(result.messages)
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [otherUser.id])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((msg) => {
        const isMine = msg.senderId === currentUserId
        return (
          <div key={msg.id} className={cn("flex items-end gap-2", isMine && "flex-row-reverse")}>
            {!isMine && (
              <UserAvatar
                username={otherUser.username}
                avatarUrl={otherUser.avatarUrl}
                size="sm"
              />
            )}
            <div
              className={cn(
                "max-w-[70%] rounded-2xl px-4 py-2 text-sm",
                isMine
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted rounded-bl-sm"
              )}
            >
              <p>{msg.content}</p>
              <p className={cn("text-[10px] mt-1 opacity-70", isMine ? "text-right" : "")}>
                {formatDistanceToNow(msg.createdAt)}
              </p>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
