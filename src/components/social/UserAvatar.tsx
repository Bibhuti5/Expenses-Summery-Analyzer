import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  username: string
  avatarUrl?: string | null
  displayName?: string | null
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeMap = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-20 text-xl",
  xl: "size-32 text-3xl",
}

export function UserAvatar({ username, avatarUrl, displayName, size = "md", className }: UserAvatarProps) {
  const initials = (displayName ?? username)
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <Avatar className={cn(sizeMap[size], className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={username} />}
      <AvatarFallback>{initials || "?"}</AvatarFallback>
    </Avatar>
  )
}
