"use client"

import { useQuery } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { Activity } from "lucide-react"

import { UserAvatar } from "@/components/shared/UserAvatar"
import { ScrollArea } from "@/components/ui/scroll-area"

export function ActivityFeed() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["analytics", "activity-feed"],
    queryFn: async () => {
      const res = await fetch("/api/analytics?type=activity-feed&limit=20")
      if (!res.ok) throw new Error("Failed to fetch activity feed")
      return res.json()
    }
  })

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col shadow-sm h-full max-h-[500px]">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <Activity className="h-5 w-5 text-slate-500" />
        <h3 className="font-semibold">Recent Activity</h3>
      </div>
      
      <ScrollArea className="flex-1 p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : logs?.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8">
            No recent activity found.
          </div>
        ) : (
          <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 space-y-6 pb-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {logs?.map((log: any) => (
              <div key={log.id} className="relative pl-6">
                <div className="absolute -left-4 top-0.5 bg-white dark:bg-slate-950 p-1 rounded-full border border-slate-200 dark:border-slate-800">
                  <UserAvatar user={log.user} className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-900 dark:text-slate-100">
                    <span className="font-medium">{log.user.name}</span>{" "}
                    {log.action}{" "}
                    {log.detail && <span className="font-medium">&quot;{log.detail}&quot;</span>}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    {log.project && ` in ${log.project.name}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
