import { Suspense } from "react"
import { searchUsers, searchPosts, getTrendingHashtags, getHashtagPosts } from "@/actions/social/search-actions"
import { getUser } from "@/actions"
import { SearchBar } from "@/components/social/SearchBar"
import { UserCard } from "@/components/social/UserCard"
import { PostCard } from "@/components/social/PostCard"
import { TrendingHashtags } from "@/components/social/TrendingHashtags"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface ExplorePageProps {
  searchParams: Promise<{ q?: string; hashtag?: string }>
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const { q, hashtag } = await searchParams
  const user = await getUser()

  let userResults = []
  let postResults = []
  let hashtagPostResults = []

  if (q) {
    ;[userResults, postResults] = await Promise.all([searchUsers(q), searchPosts(q)])
  } else if (hashtag) {
    const result = await getHashtagPosts(hashtag)
    hashtagPostResults = result.posts
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        <div className="flex-1 min-w-0 max-w-2xl space-y-4">
          <Suspense>
            <SearchBar />
          </Suspense>

          {hashtag && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-base px-3 py-1">
                #{hashtag}
              </Badge>
              <span className="text-sm text-muted-foreground">{hashtagPostResults.length} posts</span>
            </div>
          )}

          {q ? (
            <Tabs defaultValue="people">
              <TabsList>
                <TabsTrigger value="people">People ({userResults.length})</TabsTrigger>
                <TabsTrigger value="posts">Posts ({postResults.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="people" className="space-y-2 mt-4">
                {userResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">No users found</p>
                ) : (
                  userResults.map((u) => <UserCard key={u.id} user={u} />)
                )}
              </TabsContent>
              <TabsContent value="posts" className="mt-4">
                {postResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">No posts found</p>
                ) : (
                  postResults.map((p) => <PostCard key={p.id} post={p} currentUserId={user?.id} />)
                )}
              </TabsContent>
            </Tabs>
          ) : hashtag ? (
            <div>
              {hashtagPostResults.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">No posts with this hashtag</p>
              ) : (
                hashtagPostResults.map((p) => (
                  <PostCard key={p.id} post={p} currentUserId={user?.id} />
                ))
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">Search for people and posts, or browse trending hashtags →</p>
            </div>
          )}
        </div>

        <aside className="hidden lg:block w-72 shrink-0">
          <TrendingHashtags />
        </aside>
      </div>
    </div>
  )
}
