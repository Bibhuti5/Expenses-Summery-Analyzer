"use client"

import { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { sendMessage } from "@/actions/social/message-actions"
import { toast } from "sonner"

interface MessageComposerProps {
  receiverId: string
  onSent?: () => void
}

export function MessageComposer({ receiverId, onSent }: MessageComposerProps) {
  const [content, setContent] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    startTransition(async () => {
      const result = await sendMessage({ receiverId, content })
      if (result.success) {
        setContent("")
        onSent?.()
      } else {
        toast.error(result.error ?? "Failed to send message")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type a message..."
        className="flex-1"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
          }
        }}
      />
      <Button type="submit" size="icon" disabled={isPending || !content.trim()}>
        <Send className="size-4" />
      </Button>
    </form>
  )
}
