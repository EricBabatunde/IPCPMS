"use client"

import { useState, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Send, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useTyping } from "@/hooks/useTyping"

interface MessageInputProps {
  channelId: string
  isGroup: boolean
  currentUserId: string
  currentUserName: string
}

export function MessageInput({ channelId, isGroup, currentUserId, currentUserName }: MessageInputProps) {
  const [content, setContent] = useState("")
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const channelName = isGroup ? `private-group-${channelId}` : `private-conversation-${channelId}`
  const { triggerTyping } = useTyping({ channelName, currentUserId, currentUserName })

  const postUrl = isGroup ? `/api/groups/${channelId}/messages` : `/api/messages/${channelId}`

  const queryClient = useQueryClient()
  const queryKey = isGroup ? ["groupMessages", channelId] : ["conversationMessages", channelId]

  const sendMutation = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = { content: text }

      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to send message")
      return res.json()
    },
    onMutate: async ({ text }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData(queryKey)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old || !old.pages) return old

        const optimisticMessage = {
          id: `temp-${Date.now()}`,
          content: text,
          senderId: currentUserId,
          sender: { name: currentUserName, image: null },
          createdAt: new Date().toISOString(),
        }

        const newPages = [...old.pages]
        if (newPages.length > 0) {
          newPages[0] = {
            ...newPages[0],
            items: [optimisticMessage, ...newPages[0].items],
          }
        }

        return { ...old, pages: newPages }
      })

      setContent("")

      return { previousData }
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)

    triggerTyping()
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    
    // We don't trigger stop typing explicitly here because Pusher handles some of it
    // or we could let the hook implement an auto-timeout. The blueprint is basic, we just trigger.
  }

  const handleSend = () => {
    if (!content.trim()) return
    sendMutation.mutate({ text: content })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="flex gap-2 items-end">

        <Textarea
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[44px] max-h-32 resize-none rounded-xl"
        />

        <Button 
          size="icon" 
          className="h-11 w-11 rounded-xl flex-shrink-0" 
          onClick={handleSend}
          disabled={!content.trim() || sendMutation.isPending}
        >
          {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
        </Button>
      </div>
    </div>
  )
}
