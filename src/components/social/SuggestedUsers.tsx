import Link from "next/link"
import { UserAvatar } from "./UserAvatar"
import { FollowButton } from "./FollowButton"
import type { UserSummary } from "@/lib/types/social"

interface SuggestedUsersProps {
  users: UserSummary[]
}

export function SuggestedUsers({ users }: SuggestedUsersProps) {
  if (users.length === 0) return null

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <h3 className="text-sm font-semibold">Who to follow</h3>
      {users.map((user) => (
        <div key={user.id} className="flex items-center gap-3">
          <Link href={`/profile/${user.username}`}>
            <UserAvatar
              username={user.username}
              avatarUrl={user.avatarUrl}
              displayName={user.displayName}
              size="sm"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${user.username}`} className="block">
              <p className="text-sm font-medium truncate hover:underline">
                {user.displayName ?? user.username}
              </p>
              <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
            </Link>
          </div>
          <FollowButton
            targetUserId={user.id}
            initialIsFollowing={user.isFollowing ?? false}
            size="sm"
          />
        </div>
      ))}
    </div>
  )
}
