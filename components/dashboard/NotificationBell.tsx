"use client"

import { useState } from "react"
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
  const [unreadCount, setUnreadCount] = useState(3)

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
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" onClick={() => setUnreadCount(0)}>
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          <DropdownMenuGroup>
            {/* Placeholder for notifications - dynamic rendering will go here */}
            {unreadCount > 0 ? (
              <>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="font-medium text-sm">New task assigned</span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-4 line-clamp-2">
                    You have been assigned to &quot;Dashboard Wireframes&quot; by Bob Manager.
                  </span>
                  <span className="text-[10px] text-slate-400 ml-4 mt-1">2 hours ago</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="font-medium text-sm">Project milestone updated</span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-4 line-clamp-2">
                    &quot;Design Phase Complete&quot; status changed to ACHIEVED.
                  </span>
                  <span className="text-[10px] text-slate-400 ml-4 mt-1">5 hours ago</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="font-medium text-sm">New message</span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-4 line-clamp-2">
                    Alice Manager mentioned you in &quot;Steel Mill Automation Team&quot;.
                  </span>
                  <span className="text-[10px] text-slate-400 ml-4 mt-1">Yesterday</span>
                </DropdownMenuItem>
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
