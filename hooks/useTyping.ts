import { useEffect, useRef, useState, useCallback } from "react"
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

    const handleTyping = (data: { userId: string; userName: string }) => {
      if (data.userId !== currentUserId) {
        setTypingUsers((prev) => ({ ...prev, [data.userId]: data.userName }))
      }
    }

    const handleStopTyping = (data: { userId: string }) => {
      if (data.userId !== currentUserId) {
        setTypingUsers((prev) => {
          const next = { ...prev }
          delete next[data.userId]
          return next
        })
      }
    }

    channel.bind("client-typing", handleTyping)
    channel.bind("client-stop-typing", handleStopTyping)

    return () => {
      // Unbind the specific handlers, then fully release the channel
      channel.unbind("client-typing", handleTyping)
      channel.unbind("client-stop-typing", handleStopTyping)
      pusherClient.unsubscribe(channelName)
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
