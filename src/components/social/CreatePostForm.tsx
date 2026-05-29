"use client"

import { useState, useTransition } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Image, X } from "lucide-react"
import { AISuggestPopover } from "./AISuggestPopover"
import { UserAvatar } from "./UserAvatar"
import { createPost } from "@/actions/social/post-actions"
import { toast } from "sonner"

const MAX_CHARS = 280

interface CreatePostFormProps {
  user: { id: string; username: string; displayName: string | null; avatarUrl: string | null }
  onPostCreated?: () => void
}

export function CreatePostForm({ user, onPostCreated }: CreatePostFormProps) {
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [showImageInput, setShowImageInput] = useState(false)
  const [isPending, startTransition] = useTransition()

  const charsLeft = MAX_CHARS - content.length
  const isOver = charsLeft < 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || isOver) return

    startTransition(async () => {
      const result = await createPost({
        content,
        imageUrl: imageUrl.trim() || undefined,
      })
      if (result.success) {
        setContent("")
        setImageUrl("")
        setShowImageInput(false)
        toast.success("Post created!")
        onPostCreated?.()
      } else {
        toast.error(result.error ?? "Failed to create post")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="border-b p-4">
      <div className="flex gap-3">
        <UserAvatar username={user.username} avatarUrl={user.avatarUrl} displayName={user.displayName} size="md" />
        <div className="flex-1 space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            className="resize-none border-0 p-0 shadow-none focus-visible:ring-0 text-base"
          />

          {showImageInput && (
            <div className="flex gap-2 items-center">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste image URL..."
                type="url"
                className="text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => { setImageUrl(""); setShowImageInput(false) }}
                className="shrink-0"
              >
                <X className="size-4" />
              </Button>
            </div>
          )}

          {imageUrl && (
            <img
              src={imageUrl}
              alt="Preview"
              className="rounded-lg max-h-48 object-cover border"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowImageInput((v) => !v)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Image className="size-4" />
              </Button>
              <AISuggestPopover onSelect={(text) => setContent(text)} />
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-sm tabular-nums ${charsLeft < 20 ? (isOver ? "text-destructive font-semibold" : "text-amber-600") : "text-muted-foreground"}`}>
                {charsLeft}
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={isPending || !content.trim() || isOver}
              >
                {isPending ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
