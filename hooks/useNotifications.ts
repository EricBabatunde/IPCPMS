"use client"

import { useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { getPusherClient } from "@/lib/pusher-client"
import { toast } from "sonner"

export interface Notification {
  id: string
  title: string
  message: string
  type: "SYSTEM" | "PROJECT" | "TASK" | "MESSAGE"
  link?: string
  read: boolean
  createdAt: string
}

export function useNotifications() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications")
      if (!res.ok) throw new Error("Failed to fetch notifications")
      return res.json()
    },
    enabled: !!session?.user?.id,
  })

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      })
      if (!res.ok) throw new Error("Failed to mark as read")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  useEffect(() => {
    if (!session?.user?.id) return

    const pusher = getPusherClient()
    const channelName = `private-notifications-${session.user.id}`
    const channel = pusher.subscribe(channelName)

    channel.bind("new-notification", (data: Notification) => {
      // Optimistically update the notifications list
      queryClient.setQueryData(["notifications"], (prev: Notification[] = []) => [
        data,
        ...prev,
      ])
      
      toast.info(data.title, {
        description: data.message,
      })
    })

    return () => {
      pusher.unsubscribe(channelName)
    }
  }, [session?.user?.id, queryClient])

  return {
    notifications,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    unreadCount: notifications.filter((n) => !n.read).length,
  }
}
