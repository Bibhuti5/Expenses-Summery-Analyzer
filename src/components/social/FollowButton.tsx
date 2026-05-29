"use client"

import { useOptimistic, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { toggleFollow } from "@/actions/social/follow-actions"
import { toast } from "sonner"

interface FollowButtonProps {
  targetUserId: string
  initialIsFollowing: boolean
  size?: "sm" | "default"
}

export function FollowButton({ targetUserId, initialIsFollowing, size = "default" }: FollowButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [optimisticFollowing, setOptimisticFollowing] = useOptimistic(initialIsFollowing)

  function handleToggle() {
    startTransition(async () => {
      setOptimisticFollowing(!optimisticFollowing)
      try {
        await toggleFollow(targetUserId)
      } catch {
        setOptimisticFollowing(optimisticFollowing)
        toast.error("Failed to update follow status")
      }
    })
  }

  return (
    <Button
      variant={optimisticFollowing ? "outline" : "default"}
      size={size}
      onClick={handleToggle}
      disabled={isPending}
    >
      {optimisticFollowing ? "Following" : "Follow"}
    </Button>
  )
}
