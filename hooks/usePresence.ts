import { useEffect, useState } from "react"
import { getPusherClient } from "@/lib/pusher-client"

export function usePresence(userId: string | null) {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    if (!userId) return

    const pusherClient = getPusherClient()
    const channelName = `presence-user-${userId}`

    // Subscribe to the other user's presence channel to see if they are active
    const channel = pusherClient.subscribe(channelName)

    channel.bind("pusher:subscription_succeeded", (members: any) => {
      // If there's more than 1 member (or if the member id matches), they are online
      // Usually the user themselves subscribes to their own presence channel on login
      // so if they are there, members.count > 0 for their user ID.
      setIsOnline(members.count >= 1)
    })

    channel.bind("pusher:member_added", (member: any) => {
      if (member.id === userId) setIsOnline(true)
    })

    channel.bind("pusher:member_removed", (member: any) => {
      if (member.id === userId) setIsOnline(false)
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(channelName)
    }
  }, [userId])

  return isOnline
}
