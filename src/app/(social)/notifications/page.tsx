import { redirect } from "next/navigation"
import { getUser } from "@/actions"
import { getNotifications, markNotificationsRead } from "@/actions/social/notification-actions"
import { NotificationItem } from "@/components/social/NotificationItem"

export default async function NotificationsPage() {
  const user = await getUser()
  if (!user) redirect("/")

  const [notifications] = await Promise.all([
    getNotifications(),
    markNotificationsRead(),
  ])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      {notifications.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          <p className="text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  )
}
