import Link from "next/link"
import { getTrendingHashtags } from "@/actions/social/search-actions"
import { TrendingUp } from "lucide-react"

export async function TrendingHashtags() {
  const tags = await getTrendingHashtags(8)

  if (tags.length === 0) return null

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Trending</h3>
      </div>
      <div className="space-y-2">
        {tags.map(({ name, count }) => (
          <Link
            key={name}
            href={`/explore?hashtag=${name}`}
            className="flex items-center justify-between group"
          >
            <span className="text-sm text-primary font-medium group-hover:underline">#{name}</span>
            <span className="text-xs text-muted-foreground">{count} posts</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
