import { notFound } from "next/navigation"
import { getUser } from "@/actions"
import { getComments, createComment } from "@/actions/social/comment-actions"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { PostCard } from "@/components/social/PostCard"
import { UserAvatar } from "@/components/social/UserAvatar"
import { CommentSection } from "@/components/social/CommentSection"
import type { PostWithMeta } from "@/lib/types/social"

interface PostPageProps {
  params: Promise<{ postId: string }>
}

export default async function PostPage({ params }: PostPageProps) {
  const { postId } = await params
  const [user, session] = await Promise.all([getUser(), getSession()])

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      likes: { select: { userId: true } },
      comments: { select: { id: true } },
      postHashtags: { include: { hashtag: true } },
    },
  })

  if (!post) notFound()

  const postWithMeta: PostWithMeta = {
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl,
    isModerated: post.isModerated,
    moderationNote: post.moderationNote,
    createdAt: post.createdAt,
    author: post.author,
    likeCount: post.likes.length,
    commentCount: post.comments.length,
    isLikedByCurrentUser: session ? post.likes.some((l) => l.userId === session.userId) : false,
    hashtags: post.postHashtags.map((ph) => ph.hashtag.name),
  }

  const comments = await getComments(postId)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="border rounded-xl overflow-hidden">
        <PostCard post={postWithMeta} currentUserId={user?.id} />
        <CommentSection
          postId={postId}
          initialComments={comments}
          currentUser={user ? {
            id: user.id,
            username: (user as any).username,
            displayName: (user as any).displayName,
            avatarUrl: (user as any).avatarUrl,
          } : null}
        />
      </div>
    </div>
  )
}
