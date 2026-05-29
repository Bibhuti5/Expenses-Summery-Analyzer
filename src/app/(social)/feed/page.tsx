import { getUser } from "@/actions"
import { getFeedPosts } from "@/actions/social/post-actions"
import { getSuggestedUsers } from "@/actions/social/follow-actions"
import { CreatePostForm } from "@/components/social/CreatePostForm"
import { PostFeed } from "@/components/social/PostFeed"
import { SuggestedUsers } from "@/components/social/SuggestedUsers"
import { TrendingHashtags } from "@/components/social/TrendingHashtags"

export default async function FeedPage() {
  const user = await getUser()

  const [feedResult, suggestedUsers] = await Promise.all([
    getFeedPosts({ mode: "chronological", limit: 20 }),
    getSuggestedUsers(5),
  ])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        {/* Main feed column */}
        <div className="flex-1 min-w-0 max-w-2xl">
          {user && (
            <CreatePostForm
              user={user as any}
              onPostCreated={undefined}
            />
          )}
          <PostFeed
            initialPosts={feedResult.posts}
            initialCursor={feedResult.nextCursor}
            currentUserId={user?.id}
            mode="chronological"
          />
        </div>

        {/* Right sidebar */}
        <aside className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
          <SuggestedUsers users={suggestedUsers} />
          <TrendingHashtags />
        </aside>
      </div>
    </div>
  )
}
