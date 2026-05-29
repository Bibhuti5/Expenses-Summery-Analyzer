"use client"

import { useOptimistic, useTransition, useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "@/lib/format-date"
import { Heart, MessageCircle, Trash2, MoreHorizontal } from "lucide-react"
import { UserAvatar } from "./UserAvatar"
import { ModerationBadge } from "./ModerationBadge"
import { toggleLike } from "@/actions/social/like-actions"
import { deletePost } from "@/actions/social/post-actions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { PostWithMeta } from "@/lib/types/social"

interface PostCardProps {
  post: PostWithMeta
  currentUserId?: string | null
  onDeleted?: (postId: string) => void
}

export function PostCard({ post, currentUserId, onDeleted }: PostCardProps) {
  const [isPending, startTransition] = useTransition()
  const [optimisticLike, setOptimisticLike] = useOptimistic({
    liked: post.isLikedByCurrentUser,
    count: post.likeCount,
  })

  function handleLike() {
    if (!currentUserId) return
    startTransition(async () => {
      setOptimisticLike((prev) => ({
        liked: !prev.liked,
        count: prev.liked ? prev.count - 1 : prev.count + 1,
      }))
      try {
        await toggleLike(post.id)
      } catch {
        setOptimisticLike({ liked: post.isLikedByCurrentUser, count: post.likeCount })
        toast.error("Failed to like post")
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePost(post.id)
      if (result.success) {
        onDeleted?.(post.id)
        toast.success("Post deleted")
      } else {
        toast.error(result.error ?? "Failed to delete")
      }
    })
  }

  const contentWithHashtags = post.content.replace(
    /\B#(\w+)/g,
    (match, tag) => `<a href="/explore?hashtag=${tag}" class="text-primary hover:underline">${match}</a>`
  )

  return (
    <article className="border-b p-4 hover:bg-muted/30 transition-colors">
      <div className="flex gap-3">
        <Link href={`/profile/${post.author.username}`} className="shrink-0">
          <UserAvatar
            username={post.author.username}
            avatarUrl={post.author.avatarUrl}
            displayName={post.author.displayName}
            size="md"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link href={`/profile/${post.author.username}`} className="font-semibold text-sm hover:underline">
                {post.author.displayName ?? post.author.username}
              </Link>
              <span className="text-muted-foreground text-sm">@{post.author.username}</span>
              <span className="text-muted-foreground text-sm">·</span>
              <span className="text-muted-foreground text-xs">{formatDistanceToNow(post.createdAt)}</span>
            </div>

            {currentUserId === post.author.id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7 shrink-0">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem variant="destructive" onClick={handleDelete} disabled={isPending}>
                    <Trash2 className="size-4 mr-2" />
                    Delete post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <Link href={`/post/${post.id}`}>
            <p
              className="mt-1 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: contentWithHashtags }}
            />
          </Link>

          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt=""
              className="mt-3 rounded-xl border max-h-80 w-full object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}

          {post.isModerated && currentUserId === post.author.id && (
            <div className="mt-2">
              <ModerationBadge note={post.moderationNote} />
            </div>
          )}

          <div className="flex items-center gap-5 mt-3">
            <button
              onClick={handleLike}
              disabled={!currentUserId}
              className={cn(
                "flex items-center gap-1.5 text-sm transition-colors group",
                optimisticLike.liked
                  ? "text-destructive"
                  : "text-muted-foreground hover:text-destructive"
              )}
            >
              <Heart className={cn("size-4 transition-transform group-hover:scale-110", optimisticLike.liked && "fill-current")} />
              <span>{optimisticLike.count}</span>
            </button>

            <Link
              href={`/post/${post.id}`}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageCircle className="size-4" />
              <span>{post.commentCount}</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
