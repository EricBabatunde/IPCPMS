import { useEffect, useState, useCallback } from "react"
import { getPusherClient } from "@/lib/pusher-client"

interface UseTypingProps {
  channelName: string
  currentUserId: string
  currentUserName: string
}

export function useTyping({ channelName, currentUserId, currentUserName }: UseTypingProps) {
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!channelName) return

    const pusherClient = getPusherClient()
    const channel = pusherClient.subscribe(channelName)

    channel.bind("client-typing", (data: { userId: string; userName: string }) => {
      if (data.userId !== currentUserId) {
        setTypingUsers((prev) => ({ ...prev, [data.userId]: data.userName }))
      }
    })

    channel.bind("client-stop-typing", (data: { userId: string }) => {
      if (data.userId !== currentUserId) {
        setTypingUsers((prev) => {
          const newState = { ...prev }
          delete newState[data.userId]
          return newState
        })
      }
    })

    return () => {
      channel.unbind("client-typing")
      channel.unbind("client-stop-typing")
    }
  }, [channelName, currentUserId])

  const triggerTyping = useCallback(() => {
    if (!channelName) return
    const channel = getPusherClient().channel(channelName)
    channel?.trigger("client-typing", { userId: currentUserId, userName: currentUserName })
  }, [channelName, currentUserId, currentUserName])

  const triggerStopTyping = useCallback(() => {
    if (!channelName) return
    const channel = getPusherClient().channel(channelName)
    channel?.trigger("client-stop-typing", { userId: currentUserId })
  }, [channelName, currentUserId])

  return { typingUsers, triggerTyping, triggerStopTyping }
}
