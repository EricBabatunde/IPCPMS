"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { MessageSquareOff, ArrowLeft } from "lucide-react"

import { ConversationList } from "@/components/messaging/ConversationList"
import { MessageThread } from "@/components/messaging/MessageThread"
import { MessageInput } from "@/components/messaging/MessageInput"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function MessagesPage() {
  const { data: session } = useSession()
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null)
  const [isGroup, setIsGroup] = useState(false)
  const [activeChannelName, setActiveChannelName] = useState<string | null>(null)

  if (!session?.user?.id) return null

  const handleSelectChannel = (id: string, group: boolean, name: string) => {
    setActiveChannelId(id)
    setIsGroup(group)
    setActiveChannelName(name)
  }

  const handleBack = () => {
    setActiveChannelId(null)
  }

  return (
    <div className="relative flex h-[calc(100vh-5rem)] w-full overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 shadow-sm">
      {/* Sidebar: Conversation List */}
      <div 
        className={cn(
          "absolute inset-0 md:relative md:flex md:w-80 md:flex-shrink-0 z-10 transition-transform duration-300 transform",
          activeChannelId ? "-translate-x-full md:translate-x-0" : "translate-x-0"
        )}
      >
        <ConversationList 
          currentUserId={session.user.id} 
          activeChannelId={activeChannelId}
          onSelectChannel={handleSelectChannel}
        />
      </div>

      {/* Main Content: Chat Window */}
      <div 
        className={cn(
          "absolute inset-0 md:relative md:flex-1 flex flex-col min-w-0 z-20 md:z-10 bg-white dark:bg-slate-950 transition-transform duration-300 transform",
          activeChannelId ? "translate-x-0" : "translate-x-full md:translate-x-0"
        )}
      >
        {activeChannelId ? (
          <>
            <div className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 md:px-6 shrink-0 bg-white dark:bg-slate-950 shadow-sm z-10">
              <Button variant="ghost" size="icon" className="md:hidden mr-2 -ml-2 shrink-0" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5 text-slate-500" />
              </Button>
              <h3 className="font-semibold truncate pr-4">{activeChannelName}</h3>
              {isGroup && <span className="ml-auto md:ml-2 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 flex-shrink-0">Group</span>}
            </div>
            
            <MessageThread 
              channelId={activeChannelId} 
              isGroup={isGroup} 
              currentUserId={session.user.id}
              currentUserName={session.user.name || "Unknown"}
            />
            
            <MessageInput 
              channelId={activeChannelId}
              isGroup={isGroup}
              currentUserId={session.user.id}
              currentUserName={session.user.name || "Unknown"}
            />
          </>
        ) : (
          <div className="flex-1 hidden md:flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <MessageSquareOff className="h-12 w-12 mb-4 text-slate-300 dark:text-slate-700" />
            <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400">Your Messages</h3>
            <p className="text-sm mt-1 max-w-sm">Select a conversation from the sidebar or start a new one to begin chatting.</p>
          </div>
        )}
      </div>
    </div>
  )
}
