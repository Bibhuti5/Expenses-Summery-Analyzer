"use client"

import Link from "next/link"
import { UserAvatar } from "./UserAvatar"
import { FollowButton } from "./FollowButton"
import { Button } from "@/components/ui/button"
import type { UserProfile } from "@/lib/types/social"

interface ProfileHeaderProps {
  profile: UserProfile
  postCount: number
  followerCount: number
  followingCount: number
  isFollowing: boolean
  isOwnProfile: boolean
}

export function ProfileHeader({
  profile,
  postCount,
  followerCount,
  followingCount,
  isFollowing,
  isOwnProfile,
}: ProfileHeaderProps) {
  return (
    <div className="border-b pb-6 mb-6">
      <div className="flex items-start gap-4">
        <UserAvatar
          username={profile.username}
          avatarUrl={profile.avatarUrl}
          displayName={profile.displayName}
          size="xl"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold">{profile.displayName ?? profile.username}</h1>
              <p className="text-muted-foreground text-sm">@{profile.username}</p>
            </div>
            {isOwnProfile ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/profile/${profile.username}/edit`}>Edit Profile</Link>
              </Button>
            ) : (
              <FollowButton
                targetUserId={profile.id}
                initialIsFollowing={isFollowing}
                size="sm"
              />
            )}
          </div>

          {profile.bio && (
            <p className="mt-3 text-sm text-foreground/80 whitespace-pre-wrap">{profile.bio}</p>
          )}

          <div className="flex gap-6 mt-4 text-sm">
            <span>
              <strong>{postCount}</strong>{" "}
              <span className="text-muted-foreground">posts</span>
            </span>
            <span>
              <strong>{followerCount}</strong>{" "}
              <span className="text-muted-foreground">followers</span>
            </span>
            <span>
              <strong>{followingCount}</strong>{" "}
              <span className="text-muted-foreground">following</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
