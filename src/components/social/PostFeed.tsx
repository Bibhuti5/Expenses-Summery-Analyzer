"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { PostCard } from "./PostCard"
import { getFeedPosts } from "@/actions/social/post-actions"
import { Loader2 } from "lucide-react"
import type { PostWithMeta } from "@/lib/types/social"

interface PostFeedProps {
  initialPosts: PostWithMeta[]
  initialCursor?: string
  currentUserId?: string | null
  mode?: "chronological" | "algorithmic"
}

export function PostFeed({
  initialPosts,
  initialCursor,
  currentUserId,
  mode = "chronological",
}: PostFeedProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [cursor, setCursor] = useState(initialCursor)
  const [isPending, startTransition] = useTransition()
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && cursor && !isPending) {
          loadMore()
        }
      },
      { rootMargin: "200px" }
    )
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [cursor, isPending])

  function loadMore() {
    startTransition(async () => {
      const result = await getFeedPosts({ cursor, mode })
      setPosts((prev) => [...prev, ...result.posts])
      setCursor(result.nextCursor)
    })
  }

  function handleDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  if (posts.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <p className="text-sm">No posts yet. Follow people or create your first post!</p>
      </div>
    )
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onDeleted={handleDeleted}
        />
      ))}
      <div ref={sentinelRef} className="py-4 flex justify-center">
        {isPending && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
        {!isPending && !cursor && posts.length > 0 && (
          <p className="text-xs text-muted-foreground">You're all caught up</p>
        )}
      </div>
    </div>
  )
}
