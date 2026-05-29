export type NotificationType = "LIKE" | "COMMENT" | "FOLLOW"

export interface UserSummary {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  followerCount?: number
  isFollowing?: boolean
}

export interface UserProfile extends UserSummary {
  bio: string | null
  createdAt: Date
}

export interface PostWithMeta {
  id: string
  content: string
  imageUrl: string | null
  isModerated: boolean
  moderationNote: string | null
  createdAt: Date
  author: UserSummary
  likeCount: number
  commentCount: number
  isLikedByCurrentUser: boolean
  hashtags: string[]
}

export interface CommentWithAuthor {
  id: string
  content: string
  createdAt: Date
  author: UserSummary
}

export interface NotificationWithMeta {
  id: string
  type: NotificationType
  read: boolean
  createdAt: Date
  postId: string | null
  triggeredBy: UserSummary
}

export interface MessageWithSender {
  id: string
  content: string
  createdAt: Date
  senderId: string
  receiverId: string
}

export interface ConversationSummary {
  otherUser: UserSummary
  lastMessage: string
  lastMessageAt: Date
  unreadCount: number
}
