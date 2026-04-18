"use client"

import { useState } from "react"
import { useNotifications } from "@/hooks/useNotifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"

export function NotificationBell() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: notifications = [], isLoading } = useNotifications()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unreadCount = notifications.filter((n: any) => !n.read).length

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/mark-all-read", { method: "PATCH" })
      if (!res.ok) throw new Error("Failed to mark all as read")
      return res.json()
    },
    onMutate: () => {
      // Optimistic bulk clear
      queryClient.setQueryData(["notifications"], (old: any) => {
        if (!old) return old
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return old.map((n: any) => ({ ...n, read: true }))
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNotificationClick = (notification: any) => {
    // If it's a PROJECT/TASK context linking (e.g. link string stored internally or inferred)
    if (notification.type === "TASK" && notification.link) {
      router.push(notification.link)
    } else if (notification.type === "SYSTEM" && notification.body.includes("message")) {
      router.push(`/dashboard/messages`)
    } else {
      router.push(`/dashboard/notifications`)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-primary" />
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-0 text-xs text-primary" 
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              {markAllReadMutation.isPending ? "Marking..." : "Mark all as read"}
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          <DropdownMenuGroup>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                Loading...
              </div>
            ) : notifications.length > 0 ? (
              <>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {notifications.slice(0, 10).map((notification: any) => (
                  <div key={notification.id}>
                    <DropdownMenuItem 
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${notification.read ? "" : "bg-primary/5"}`}
                    >
                      <div className="flex items-center gap-2">
                        {!notification.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                        <span className="font-medium text-sm">{notification.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-4 line-clamp-2">
                        {notification.body}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-4 mt-1">
                        {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </div>
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Bell className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">All caught up!</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No new notifications.</p>
              </div>
            )}
          </DropdownMenuGroup>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
