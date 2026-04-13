"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Bell, Loader2, Info, FileText, CheckCircle2, MessageSquare, Check } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  link?: string
  createdAt: string
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications")
      if (!res.ok) throw new Error("Failed to fetch notifications")
      return res.json()
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", { method: "PATCH" })
      if (!res.ok) throw new Error("Failed to mark read")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast.success("All notifications marked as read")
    },
    onError: () => {
      toast.error("Failed to update notifications")
    }
  })

  const getIcon = (type: string) => {
    switch (type) {
      case "SYSTEM": return <Info className="h-5 w-5 text-blue-500" />
      case "PROJECT": return <FileText className="h-5 w-5 text-indigo-500" />
      case "TASK": return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case "MESSAGE": return <MessageSquare className="h-5 w-5 text-amber-500" />
      default: return <Bell className="h-5 w-5 text-slate-500" />
    }
  }

  const unreadCount = notifications.filter((n: Notification) => !n.read).length

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader 
          title="Notifications" 
          description="Stay updated with the latest activity across your projects."
        />
        {unreadCount > 0 && (
          <Button 
            onClick={() => markAllReadMutation.mutate()} 
            disabled={markAllReadMutation.isPending}
            variant="outline"
            className="rounded-xl border-slate-200 dark:border-slate-800"
          >
            {markAllReadMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-10 w-10" />}
          title="All caught up!"
          description="You don't have any new notifications at the moment."
        />
      ) : (
        <div className="grid gap-4">
          {notifications.map((notification: Notification) => (
            <div 
              key={notification.id} 
              className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${
                notification.read 
                  ? 'bg-white border-slate-100 dark:bg-slate-950 dark:border-slate-800 opacity-75 hover:opacity-100' 
                  : 'bg-white border-primary/20 dark:bg-slate-950 dark:border-primary/20 shadow-sm ring-1 ring-primary/5'
              }`}
            >
              <div className={`p-2 rounded-xl flex-shrink-0 ${
                notification.read ? 'bg-slate-50 dark:bg-slate-900' : 'bg-primary/10'
              }`}>
                {getIcon(notification.type)}
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-sm font-bold truncate ${notification.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-slate-100'}`}>
                    {notification.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {notification.message}
                </p>
                {notification.link && (
                  <Button variant="link" size="sm" className="h-auto p-0 text-primary text-xs font-semibold" asChild>
                    <a href={notification.link}>View details</a>
                  </Button>
                )}
              </div>
              {!notification.read && (
                <div className="flex-shrink-0 h-2 w-2 rounded-full bg-primary mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
