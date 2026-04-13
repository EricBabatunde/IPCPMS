import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { getPusherClient } from "@/lib/pusher-client"

interface UseMessagesProps {
  channelId: string | null
  isGroup: boolean
  onNewMessage?: () => void
}

export function useMessages({ channelId, isGroup, onNewMessage }: UseMessagesProps) {
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    if (!channelId) {
      setMessages([])
      return
    }

    // Explicitly reset messages when channelId changes to prevent data leakage across different chats
    setMessages([])

    const pusherClient = getPusherClient()
    const channelName = isGroup ? `private-group-${channelId}` : `private-conversation-${channelId}`
    const eventName = isGroup ? "new-group-message" : "new-message"

    const channel = pusherClient.subscribe(channelName)

    channel.bind(eventName, (data: any) => {
      // Handle incoming message
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some((m) => m.id === data.id)) return prev
        return [data, ...prev]
      })

      // Invalidate existing react-query data if we are using it elsewhere
      if (isGroup) {
        queryClient.invalidateQueries({ queryKey: ["groupMessages", channelId] })
      } else {
        queryClient.invalidateQueries({ queryKey: ["conversationMessages", channelId] })
        // Also update conversation list lastMessageAt
        queryClient.invalidateQueries({ queryKey: ["conversations"] })
      }
      
      onNewMessage?.()
    })

    return () => {
      channel.unbind(eventName)
      pusherClient.unsubscribe(channelName)
    }
  }, [channelId, isGroup, queryClient, onNewMessage])

  return { pusherMessages: messages, setPusherMessages: setMessages }
}
