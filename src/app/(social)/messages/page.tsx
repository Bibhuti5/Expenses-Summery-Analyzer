import { redirect } from "next/navigation"
import { getUser } from "@/actions"
import { getConversations } from "@/actions/social/message-actions"
import { ConversationList } from "@/components/social/ConversationList"

export default async function MessagesPage() {
  const user = await getUser()
  if (!user) redirect("/")

  const conversations = await getConversations()

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <div className="border rounded-xl overflow-hidden">
        <ConversationList conversations={conversations} />
      </div>
    </div>
  )
}
