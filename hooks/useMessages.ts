import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { getPusherClient } from "@/lib/pusher-client"

interface UseMessagesProps {
  channelId: string | null
  isGroup: boolean
  // Intentionally NOT in the dependency array — consumers must wrap in useCallback
  // to avoid the infinite resubscription loop.
  onNewMessage?: () => void
}

export function useMessages({ channelId, isGroup, onNewMessage }: UseMessagesProps) {
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<any[]>([]) // eslint-disable-line @typescript-eslint/no-explicit-any

  // Store onNewMessage in a ref so we can call the latest version without
  // including it in the useEffect dependency array. This prevents the
  // infinite loop caused by an inline arrow function being a new reference
  // on every render.
  const onNewMessageRef = useRef(onNewMessage)
  useEffect(() => {
    onNewMessageRef.current = onNewMessage
  }, [onNewMessage])

  useEffect(() => {
    if (!channelId) {
      setMessages([])
      return
    }

    // Reset messages immediately when the channel changes
    setMessages([])

    const pusherClient = getPusherClient()
    const channelName = isGroup
      ? `private-group-${channelId}`
      : `private-conversation-${channelId}`
    const eventName = isGroup ? "new-group-message" : "new-message"

    const channel = pusherClient.subscribe(channelName)

    const handleNewMessage = (data: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev
        return [data, ...prev]
      })

      if (isGroup) {
        queryClient.invalidateQueries({ queryKey: ["groupMessages", channelId] })
      } else {
        queryClient.invalidateQueries({ queryKey: ["conversationMessages", channelId] })
        queryClient.invalidateQueries({ queryKey: ["conversations"] })
      }

      // Call via ref — never stale, never a dep
      onNewMessageRef.current?.()
    }

    channel.bind(eventName, handleNewMessage)

    return () => {
      channel.unbind(eventName, handleNewMessage)
      // Full unsubscribe so Pusher releases the auth socket
      pusherClient.unsubscribe(channelName)
    }
    // onNewMessage is intentionally omitted — handled via ref above
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, isGroup, queryClient])

  return { pusherMessages: messages, setPusherMessages: setMessages }
}
