import { Badge } from "@/components/ui/badge"
import { ShieldAlert } from "lucide-react"

interface ModerationBadgeProps {
  note: string | null
}

export function ModerationBadge({ note }: ModerationBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
      <ShieldAlert className="size-3.5 shrink-0" />
      <Badge variant="warning" className="text-xs">
        Flagged by AI
      </Badge>
      {note && <span className="text-xs text-muted-foreground">· {note}</span>}
    </div>
  )
}
