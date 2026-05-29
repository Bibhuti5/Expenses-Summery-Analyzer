"use client"

import { useState, useTransition } from "react"
import { UserAvatar } from "./UserAvatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createComment } from "@/actions/social/comment-actions"
import { formatDistanceToNow } from "@/lib/format-date"
import { toast } from "sonner"
import type { CommentWithAuthor, UserSummary } from "@/lib/types/social"

interface CommentSectionProps {
  postId: string
  initialComments: CommentWithAuthor[]
  currentUser: UserSummary | null
}

export function CommentSection({ postId, initialComments, currentUser }: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments)
  const [content, setContent] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    startTransition(async () => {
      const result = await createComment({ postId, content })
      if (result.success && result.comment) {
        setComments((prev) => [...prev, result.comment!])
        setContent("")
      } else {
        toast.error(result.error ?? "Failed to post comment")
      }
    })
  }

  return (
    <div className="border-t">
      {currentUser && (
        <form onSubmit={handleSubmit} className="flex gap-3 p-4 border-b">
          <UserAvatar
            username={currentUser.username}
            avatarUrl={currentUser.avatarUrl}
            displayName={currentUser.displayName}
            size="sm"
          />
          <div className="flex-1 space-y-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
              className="resize-none text-sm"
            />
            <Button type="submit" size="sm" disabled={isPending || !content.trim()}>
              {isPending ? "Posting..." : "Comment"}
            </Button>
          </div>
        </form>
      )}

      <div>
        {comments.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-4 border-b last:border-b-0">
              <UserAvatar
                username={comment.author.username}
                avatarUrl={comment.author.avatarUrl}
                displayName={comment.author.displayName}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold">{comment.author.displayName ?? comment.author.username}</span>
                  <span className="text-xs text-muted-foreground">@{comment.author.username}</span>
                  <span className="text-xs text-muted-foreground">· {formatDistanceToNow(comment.createdAt)}</span>
                </div>
                <p className="text-sm mt-0.5">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
