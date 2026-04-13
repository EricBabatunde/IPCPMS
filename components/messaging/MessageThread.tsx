"use client"

import { useEffect, useRef } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { Loader2, FileText } from "lucide-react"

import { useMessages } from "@/hooks/useMessages"
import { useTyping } from "@/hooks/useTyping"
import { UserAvatar } from "@/components/shared/UserAvatar"

interface MessageThreadProps {
  channelId: string
  isGroup: boolean
  currentUserId: string
  currentUserName: string
}

export function MessageThread({ channelId, isGroup, currentUserId, currentUserName }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  
  const queryKey = isGroup ? ["groupMessages", channelId] : ["conversationMessages", channelId]
  const fetchUrl = isGroup ? `/api/groups/${channelId}/messages` : `/api/messages/${channelId}`

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = "" }) => {
      const url = pageParam ? `${fetchUrl}?cursor=${pageParam}` : fetchUrl
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch messages")
      return res.json()
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    initialPageParam: "",
  })

  // Hook up real-time Pusher messages
  const { pusherMessages } = useMessages({ 
    channelId, 
    isGroup,
    onNewMessage: () => {
      // Auto-scroll on new message
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  })

  // Hook up typing indicators
  const channelName = isGroup ? `private-group-${channelId}` : `private-conversation-${channelId}`
  const { typingUsers } = useTyping({ channelName, currentUserId, currentUserName })
  
  const typingUserNames = Object.values(typingUsers)

  // Auto-scroll on initial load
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" })
  }, [channelId])

  if (status === "pending") {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900/20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  // Combine query messages (pages) and pusher messages
  const historyMessages = data?.pages.flatMap((page) => page.items) || []
  
  // Real-time messages might already be in history if we refetched; filter duplicates
  const historyIds = new Set(historyMessages.map((m) => m.id))
  const newMessages = pusherMessages.filter((m) => !historyIds.has(m.id))
  
  // All messages, oldest first for display (query returns newest first, so we reverse)
  const allMessages = [...newMessages, ...historyMessages].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6">
        {hasNextPage && (
          <div className="flex justify-center pb-4">
            <button 
              onClick={() => fetchNextPage()} 
              disabled={isFetchingNextPage}
              className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors text-slate-600 dark:text-slate-300"
            >
              {isFetchingNextPage ? "Loading..." : "Load older messages"}
            </button>
          </div>
        )}

        {allMessages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-slate-500 text-sm">No messages here yet. Say hello!</p>
          </div>
        ) : (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          allMessages.map((msg: any, index) => {
            const isMe = msg.senderId === currentUserId
            const prevMsg = allMessages[index - 1]
            const showHeader = !prevMsg || prevMsg.senderId !== msg.senderId || 
              (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 5 * 60000)

            return (
              <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                {showHeader ? (
                  <UserAvatar user={msg.sender} className="h-8 w-8 flex-shrink-0 mt-auto mb-1" />
                ) : (
                  <div className="w-8 flex-shrink-0" />
                )}
                
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {showHeader && (
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {isMe ? "You" : msg.sender?.name || "Unknown"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {format(new Date(msg.createdAt), "h:mm a")}
                      </span>
                    </div>
                  )}
                  
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-primary text-primary-foreground rounded-br-sm' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm'
                  }`}>
                    {msg.fileUrl && (
                      <div className="mb-2">
                        {msg.fileType?.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={msg.fileUrl} alt="Attachment" className="max-w-[200px] sm:max-w-xs rounded-md" />
                        ) : (
                          <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black/10 dark:bg-white/10 p-2 rounded-md hover:bg-black/20 dark:hover:bg-white/20 transition-colors">
                            <FileText className="h-4 w-4" />
                            <span className="underline truncate max-w-[150px]">View Attachment</span>
                          </a>
                        )}
                      </div>
                    )}
                    {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                  </div>
                </div>
              </div>
            )
          })
        )}
        
        {typingUserNames.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500 italic pb-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            {typingUserNames.join(", ")} {typingUserNames.length === 1 ? "is typing..." : "are typing..."}
          </div>
        )}

        <div ref={bottomRef} className="h-px w-full" />
      </div>
    </div>
  )
}
