import { redirect, notFound } from "next/navigation"
import { getUser } from "@/actions"
import { getMessages, getOtherUserById } from "@/actions/social/message-actions"
import { MessageThread } from "@/components/social/MessageThread"
import { MessageComposer } from "@/components/social/MessageComposer"
import { UserAvatar } from "@/components/social/UserAvatar"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface MessageThreadPageProps {
  params: Promise<{ userId: string }>
}

export default async function MessageThreadPage({ params }: MessageThreadPageProps) {
  const { userId } = await params
  const user = await getUser()
  if (!user) redirect("/")

  const [otherUser, messagesResult] = await Promise.all([
    getOtherUserById(userId),
    getMessages(userId),
  ])

  if (!otherUser) notFound()

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <div className="flex items-center gap-3 p-4 border-b shrink-0">
        <Link href="/messages" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <Link href={`/profile/${otherUser.username}`}>
          <UserAvatar
            username={otherUser.username}
            avatarUrl={otherUser.avatarUrl}
            displayName={otherUser.displayName}
            size="sm"
          />
        </Link>
        <div>
          <p className="font-semibold text-sm">{otherUser.displayName ?? otherUser.username}</p>
          <p className="text-xs text-muted-foreground">@{otherUser.username}</p>
        </div>
      </div>

      <MessageThread
        otherUser={otherUser}
        currentUserId={user.id}
        initialMessages={messagesResult.messages}
      />

      <MessageComposer receiverId={userId} />
    </div>
  )
}
