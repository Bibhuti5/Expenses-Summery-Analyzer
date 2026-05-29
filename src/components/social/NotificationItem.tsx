import Link from "next/link"
import { Heart, MessageCircle, UserPlus } from "lucide-react"
import { UserAvatar } from "./UserAvatar"
import { formatDistanceToNow } from "@/lib/format-date"
import { cn } from "@/lib/utils"
import type { NotificationWithMeta } from "@/lib/types/social"

const typeConfig = {
  LIKE: { icon: Heart, label: "liked your post", color: "text-destructive" },
  COMMENT: { icon: MessageCircle, label: "commented on your post", color: "text-blue-500" },
  FOLLOW: { icon: UserPlus, label: "started following you", color: "text-green-500" },
}

interface NotificationItemProps {
  notification: NotificationWithMeta
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const config = typeConfig[notification.type]
  const Icon = config.icon

  return (
    <div className={cn("flex items-start gap-3 p-4 border-b hover:bg-muted/30 transition-colors", !notification.read && "bg-primary/5")}>
      <div className="relative">
        <Link href={`/profile/${notification.triggeredBy.username}`}>
          <UserAvatar
            username={notification.triggeredBy.username}
            avatarUrl={notification.triggeredBy.avatarUrl}
            displayName={notification.triggeredBy.displayName}
            size="md"
          />
        </Link>
        <span className={cn("absolute -bottom-1 -right-1 bg-background rounded-full p-0.5", config.color)}>
          <Icon className="size-3" />
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <Link href={`/profile/${notification.triggeredBy.username}`} className="font-semibold hover:underline">
            {notification.triggeredBy.displayName ?? notification.triggeredBy.username}
          </Link>{" "}
          {notification.postId ? (
            <Link href={`/post/${notification.postId}`} className="hover:underline">
              {config.label}
            </Link>
          ) : (
            config.label
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatDistanceToNow(notification.createdAt)}</p>
      </div>

      {!notification.read && (
        <div className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
      )}
    </div>
  )
}
