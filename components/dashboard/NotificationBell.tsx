"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Info, FileText, CheckCircle2, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

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
import { useNotifications, Notification } from "@/hooks/useNotifications"

export function NotificationBell() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, unreadCount, markAsRead } = useNotifications()

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read immediately
    if (!notification.read) {
      markAsRead(notification.id)
    }
    
    // Close dropdown
    setIsOpen(false)
    
    // Redirect if link exists
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "SYSTEM": return <Info className="h-4 w-4 text-blue-500" />
      case "PROJECT": return <FileText className="h-4 w-4 text-indigo-500" />
      case "TASK": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case "MESSAGE": return <MessageSquare className="h-4 w-4 text-amber-500" />
      default: return <Bell className="h-4 w-4 text-slate-500" />
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-xl overflow-hidden p-0 shadow-xl border-slate-200 dark:border-slate-800">
        <DropdownMenuLabel className="flex justify-between items-center p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
          <span className="font-bold">Notifications</span>
        </DropdownMenuLabel>
        <ScrollArea className="h-[350px]">
          <DropdownMenuGroup>
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <div key={notification.id}>
                  <DropdownMenuItem 
                    className={`flex flex-col items-start gap-1 p-4 cursor-pointer focus:bg-slate-50 dark:focus:bg-slate-900 transition-colors ${!notification.read ? 'bg-primary/5' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {getIcon(notification.type)}
                      <span className="font-semibold text-sm flex-1">{notification.title}</span>
                      {!notification.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1 px-6">
                      {notification.message}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-2 px-6">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </DropdownMenuItem>
                  {index < notifications.length - 1 && <DropdownMenuSeparator className="m-0" />}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-slate-300 dark:text-gray-600" />
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">All caught up!</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[180px]">You don&apos;t have any notifications right now.</p>
              </div>
            )}
          </DropdownMenuGroup>
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
             <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500" asChild>
                <a href="/dashboard/notifications">View all notifications</a>
             </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
