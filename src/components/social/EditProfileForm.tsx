"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateProfile } from "@/actions/social/profile-actions"
import { toast } from "sonner"
import type { UserProfile } from "@/lib/types/social"

interface EditProfileFormProps {
  user: UserProfile
}

export function EditProfileForm({ user }: EditProfileFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [fields, setFields] = useState({
    username: user.username,
    displayName: user.displayName ?? "",
    bio: user.bio ?? "",
    avatarUrl: user.avatarUrl ?? "",
  })

  function set(key: keyof typeof fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateProfile({
        username: fields.username || undefined,
        displayName: fields.displayName || undefined,
        bio: fields.bio || undefined,
        avatarUrl: fields.avatarUrl || undefined,
      })
      if (result.success) {
        toast.success("Profile updated!")
        router.push(`/profile/${fields.username || user.username}`)
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to update profile")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div className="space-y-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          value={fields.displayName}
          onChange={(e) => set("displayName", e.target.value)}
          placeholder="Your full name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
          <Input
            id="username"
            value={fields.username}
            onChange={(e) => set("username", e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
            className="pl-7"
            placeholder="username"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={fields.bio}
          onChange={(e) => set("bio", e.target.value)}
          placeholder="Tell people about yourself..."
          rows={3}
          maxLength={160}
        />
        <p className="text-xs text-muted-foreground text-right">{fields.bio.length}/160</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatarUrl">Avatar URL</Label>
        <Input
          id="avatarUrl"
          value={fields.avatarUrl}
          onChange={(e) => set("avatarUrl", e.target.value)}
          placeholder="https://example.com/avatar.jpg"
          type="url"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
