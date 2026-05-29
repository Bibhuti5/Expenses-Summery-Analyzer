import Link from "next/link"
import { UserAvatar } from "./UserAvatar"
import { FollowButton } from "./FollowButton"
import type { UserSummary } from "@/lib/types/social"

interface UserCardProps {
  user: UserSummary
}

export function UserCard({ user }: UserCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
      <Link href={`/profile/${user.username}`}>
        <UserAvatar username={user.username} avatarUrl={user.avatarUrl} displayName={user.displayName} />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/profile/${user.username}`}>
          <p className="text-sm font-medium hover:underline truncate">{user.displayName ?? user.username}</p>
          <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
        </Link>
        {user.followerCount !== undefined && (
          <p className="text-xs text-muted-foreground mt-0.5">{user.followerCount} followers</p>
        )}
      </div>
      <FollowButton
        targetUserId={user.id}
        initialIsFollowing={user.isFollowing ?? false}
        size="sm"
      />
    </div>
  )
}
