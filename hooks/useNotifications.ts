"use client"

import { useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { getPusherClient } from "@/lib/pusher-client"

export interface Notification {
  id: string
  title: string
  body: string
  type: string
  read: boolean
  createdAt: string
  userId: string
}

export function useNotifications() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const userId = session?.user?.id

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications")
      if (!res.ok) throw new Error("Failed to fetch notifications")
      return res.json() as Promise<Notification[]>
    },
    enabled: !!userId,
  })

  useEffect(() => {
    if (!userId) return

    const pusherClient = getPusherClient()
    const channelName = `private-user-${userId}`
    const channel = pusherClient.subscribe(channelName)

    channel.bind("new_notification", (newNotification: Notification) => {
      queryClient.setQueryData<Notification[]>(["notifications"], (oldData) => {
        if (!oldData) return [newNotification]
        // Prevent duplicates
        if (oldData.some((n) => n.id === newNotification.id)) return oldData
        return [newNotification, ...oldData]
      })
    })

    return () => {
      channel.unbind("new_notification")
      pusherClient.unsubscribe(channelName)
    }
  }, [userId, queryClient])

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "PATCH",
      })
      if (!res.ok) throw new Error("Failed to mark all as read")
      return res.json()
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] })
      const previousNotifications = queryClient.getQueryData<Notification[]>(["notifications"])

      queryClient.setQueryData<Notification[]>(["notifications"], (old) => {
        if (!old) return old
        return old.map(n => ({ ...n, read: true }))
      })

      return { previousNotifications }
    },
    onError: (err, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(["notifications"], context.previousNotifications)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  return { ...query, markAllAsRead }
}
