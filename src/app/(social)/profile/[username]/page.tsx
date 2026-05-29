import { notFound } from "next/navigation"
import { getUserProfile, getUserPosts } from "@/actions/social/profile-actions"
import { ProfileHeader } from "@/components/social/ProfileHeader"
import { PostFeed } from "@/components/social/PostFeed"
import { getUser } from "@/actions"

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const [profileData, user] = await Promise.all([
    getUserProfile(username),
    getUser(),
  ])

  if (!profileData) notFound()

  const { user: profile, postCount, followerCount, followingCount, isFollowing, isOwnProfile } = profileData
  const userPostsResult = await getUserPosts(profile.id)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <ProfileHeader
        profile={profile}
        postCount={postCount}
        followerCount={followerCount}
        followingCount={followingCount}
        isFollowing={isFollowing}
        isOwnProfile={isOwnProfile}
      />
      <PostFeed
        initialPosts={userPostsResult.posts}
        initialCursor={userPostsResult.nextCursor}
        currentUserId={user?.id}
        mode="chronological"
      />
    </div>
  )
}
