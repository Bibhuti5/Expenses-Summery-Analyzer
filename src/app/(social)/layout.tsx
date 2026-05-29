import { getUser } from "@/actions"
import { getUnreadNotificationCount } from "@/actions/social/notification-actions"
import { SocialSidebar } from "@/components/social/SocialSidebar"
import { Toaster } from "@/components/ui/sonner"

export default async function SocialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  const unreadCount = user ? await getUnreadNotificationCount() : 0

  return (
    <div className="min-h-screen bg-background flex">
      <SocialSidebar user={user} unreadCount={unreadCount} />
      <main className="flex-1 md:ml-64 pb-16 md:pb-0">
        {children}
      </main>
      <Toaster position="bottom-right" />
    </div>
  )
}
