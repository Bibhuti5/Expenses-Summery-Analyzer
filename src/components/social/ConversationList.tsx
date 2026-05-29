"use client"

import Link from "next/link"
import { UserAvatar } from "./UserAvatar"
import { formatDistanceToNow } from "@/lib/format-date"
import { cn } from "@/lib/utils"
import type { ConversationSummary } from "@/lib/types/social"

interface ConversationListProps {
  conversations: ConversationSummary[]
  activeUserId?: string
}

export function ConversationList({ conversations, activeUserId }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        No messages yet. Follow someone and start a conversation!
      </div>
    )
  }

  return (
    <div>
      {conversations.map(({ otherUser, lastMessage, lastMessageAt, unreadCount }) => (
        <Link
          key={otherUser.id}
          href={`/messages/${otherUser.id}`}
          className={cn(
            "flex items-center gap-3 p-4 border-b hover:bg-muted/30 transition-colors",
            activeUserId === otherUser.id && "bg-muted"
          )}
        >
          <div className="relative">
            <UserAvatar
              username={otherUser.username}
              avatarUrl={otherUser.avatarUrl}
              displayName={otherUser.displayName}
            />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className={cn("text-sm truncate", unreadCount > 0 ? "font-semibold" : "font-medium")}>
                {otherUser.displayName ?? otherUser.username}
              </p>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">
                {formatDistanceToNow(lastMessageAt)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{lastMessage}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
