"use client"

import { useNotifications } from "@/hooks/useNotifications"
import { Bell, Loader2, Info, FileText, CheckCircle2, CheckCircle } from "lucide-react"
import { format } from "date-fns"

import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"

export default function NotificationsPage() {
  const { data: notifications = [], isLoading, markAllAsRead } = useNotifications()

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
        action={
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => markAllAsRead.mutate()}
            disabled={notifications.every(n => n.read) || markAllAsRead.isPending}
            className="hidden sm:flex"
          >
            {markAllAsRead.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Mark all as read
          </Button>
        }
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
                  {notification.body}
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
