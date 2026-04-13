"use client"

import { useState, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Send, Paperclip, Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useUploadThing } from "@/lib/uploadthing"
import { useTyping } from "@/hooks/useTyping"

interface MessageInputProps {
  channelId: string
  isGroup: boolean
  currentUserId: string
  currentUserName: string
}

export function MessageInput({ channelId, isGroup, currentUserId, currentUserName }: MessageInputProps) {
  const [content, setContent] = useState("")
  const [fileAttachment, setFileAttachment] = useState<{ url: string; name: string; type: string } | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { startUpload, isUploading } = useUploadThing("messageAttachment", {
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        // Use the actual type from UploadThing
        setFileAttachment({ 
          url: res[0].url, 
          name: res[0].name, 
          type: res[0].type 
        })
      }
    },
    onUploadError: (e) => {
      console.error("Upload error:", e.message)
    }
  })

  const channelName = isGroup ? `private-group-${channelId}` : `private-conversation-${channelId}`
  const queryKey = isGroup ? ["groupMessages", channelId] : ["conversationMessages", channelId]
  const { triggerTyping } = useTyping({ channelName, currentUserId, currentUserName })

  const postUrl = isGroup ? `/api/groups/${channelId}/messages` : `/api/messages/${channelId}`
  const queryClient = useQueryClient()

  const sendMutation = useMutation({
    mutationFn: async ({ text, file }: { text: string; file: typeof fileAttachment }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = { content: text }
      if (file) {
        payload.fileUrl = file.url
        payload.fileType = file.type
      }

      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to send message")
      return res.json()
    },
    onSuccess: () => {
      setContent("")
      setFileAttachment(null)
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
    if (!content.trim() && !fileAttachment) return
    sendMutation.mutate({ text: content, file: fileAttachment })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      {fileAttachment && (
        <div className="mb-3 flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-md border border-slate-200 dark:border-slate-800 w-fit relative pr-10">
          <Paperclip className="h-4 w-4 text-slate-500" />
          <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{fileAttachment.name}</span>
          <button 
            onClick={() => setFileAttachment(null)} 
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex gap-2 items-end">
        <div className="pb-1.5 px-1 relative">
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            disabled={isUploading}
            onChange={(e) => {
              if (e.target.files?.length) {
                startUpload(Array.from(e.target.files))
              }
            }} 
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 shrink-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={handleFileClick}
            disabled={isUploading}
            type="button"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" /> : <Paperclip className="h-4 w-4 text-slate-500" />}
          </Button>
        </div>

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
          disabled={(!content.trim() && !fileAttachment) || sendMutation.isPending}
        >
          {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
        </Button>
      </div>
    </div>
  )
}
