"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FolderKanban, MessageSquare, Bell, Users, Code, Menu } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { useAppStore } from "@/store/useAppStore"
import { useShallow } from "zustand/react/shallow"

const mainNavItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { title: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { title: "Team", href: "/dashboard/team", icon: Users },
  { title: "Notifications", href: "/dashboard/notifications", icon: Bell },
]

export function MobileSidebar() {
  const pathname = usePathname()
  
  const { isMobileSidebarOpen, toggleMobileSidebar, closeMobileSidebar } = useAppStore(
    useShallow((state) => ({
      isMobileSidebarOpen: state.isMobileSidebarOpen,
      toggleMobileSidebar: state.toggleMobileSidebar,
      closeMobileSidebar: state.closeMobileSidebar,
    }))
  )

  const handleLinkClick = () => {
    closeMobileSidebar()
    // Forcefully remove the sticky pointer-events: none left by Radix UI Sheet routing
    setTimeout(() => {
      document.body.style.pointerEvents = ""
    }, 10)
  }

  return (
    <Sheet open={isMobileSidebarOpen} onOpenChange={toggleMobileSidebar}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 flex-col p-0">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Navigation Menu</SheetDescription>
        <div className="flex h-14 items-center border-b border-slate-200 px-6 dark:border-slate-800 lg:h-[60px]">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold" onClick={handleLinkClick}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Code className="h-5 w-5" />
            </div>
            <span className="text-xl tracking-tight text-slate-900 dark:text-slate-50">IPCPMS</span>
          </Link>
        </div>
        <ScrollArea className="flex-1 py-4">
          <nav className="grid gap-1 px-4 text-sm font-medium">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-slate-500 transition-all hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50",
                  pathname === item.href ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50" : ""
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
