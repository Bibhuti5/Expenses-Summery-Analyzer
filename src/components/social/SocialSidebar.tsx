"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Search,
  Bell,
  MessageCircle,
  User,
  Layers,
  LogIn,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { UserAvatar } from "./UserAvatar"

interface SocialSidebarProps {
  user: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    email: string
  } | null
  unreadCount: number
}

const navItems = (username: string | null) => [
  { href: "/feed", icon: Home, label: "Home" },
  { href: "/explore", icon: Search, label: "Explore" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/messages", icon: MessageCircle, label: "Messages" },
  ...(username ? [{ href: `/profile/${username}`, icon: User, label: "Profile" }] : []),
]

export function SocialSidebar({ user, unreadCount }: SocialSidebarProps) {
  const pathname = usePathname()

  const items = navItems(user?.username ?? null)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 border-r bg-background px-4 py-6 z-40">
        <div className="mb-8 px-2">
          <h1 className="text-2xl font-bold tracking-tight">Nexus</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Social · AI-enhanced</p>
        </div>

        <nav className="flex-1 space-y-1">
          {items.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/")
            const isBell = label === "Notifications"
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <span className="relative">
                  <Icon className="size-5" />
                  {isBell && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            )
          })}

          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Layers className="size-5" />
            Studio
          </Link>
        </nav>

        {/* User info at bottom */}
        <div className="border-t pt-4 mt-4">
          {user ? (
            <div className="flex items-center gap-3 px-2">
              <UserAvatar
                username={user.username}
                avatarUrl={user.avatarUrl}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.displayName ?? user.username}</p>
                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
              </div>
            </div>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
            >
              <LogIn className="size-5" />
              Sign in
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-40 flex">
        {items.slice(0, 5).map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")
          const isBell = label === "Notifications"
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <span className="relative">
                <Icon className="size-5" />
                {isBell && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
