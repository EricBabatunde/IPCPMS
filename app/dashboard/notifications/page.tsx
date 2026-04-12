"use client"

import { useQuery } from "@tanstack/react-query"
import { Bell, Loader2, Info, FileText, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"

import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications")
      if (!res.ok) throw new Error("Failed to fetch notifications")
      return res.json()
    },
  })

  const getIcon = (type: string) => {
    switch (type) {
      case "SYSTEM": return <Info className="h-5 w-5 text-blue-500" />
      case "PROJECT": return <FileText className="h-5 w-5 text-indigo-500" />
      case "TASK": return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      default: return <Bell className="h-5 w-5 text-slate-500" />
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader 
        title="Notifications" 
        description="Stay updated with the latest activity across your projects."
      />

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
        <div className="space-y-4">
          {notifications.map((notification: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
            <div 
              key={notification.id} 
              className={`flex items-start gap-4 p-4 rounded-xl border ${notification.read ? 'bg-white border-slate-100 dark:bg-slate-950 dark:border-slate-800' : 'bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30'}`}
            >
              <div className="flex-shrink-0 mt-1">
                {getIcon(notification.type)}
              </div>
              <div className="space-y-1 flex-1">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {notification.title}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {notification.message}
                </p>
                <div className="text-xs text-slate-500">
                  {format(new Date(notification.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
              {!notification.read && (
                <div className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
