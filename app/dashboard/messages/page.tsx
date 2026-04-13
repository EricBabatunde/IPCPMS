"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { MessageSquareOff, ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

import { ConversationList } from "@/components/messaging/ConversationList"
import { MessageThread } from "@/components/messaging/MessageThread"
import { MessageInput } from "@/components/messaging/MessageInput"

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

  return (
    <div className="flex h-[calc(100vh-5rem)] w-full overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 shadow-sm relative">
      {/* Sidebar: Conversation List */}
      <div className={`shrink-0 h-full w-full md:w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 absolute md:relative z-20 md:z-auto transition-transform duration-300 md:translate-x-0 ${activeChannelId ? '-translate-x-full md:flex' : 'flex'}`}>
        <ConversationList 
          currentUserId={session.user.id} 
          activeChannelId={activeChannelId}
          onSelectChannel={handleSelectChannel}
        />
      </div>

      {/* Main Content: Chat Window */}
      <div className={`flex-1 flex flex-col min-w-0 absolute md:relative inset-0 bg-white dark:bg-slate-950 z-10 transition-transform duration-300 md:translate-x-0 overflow-hidden ${!activeChannelId ? 'translate-x-full md:flex' : 'flex'}`}>
        {activeChannelId ? (
          <>
            <div className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 shrink-0 bg-white dark:bg-slate-950 shadow-sm z-10">
              <Button variant="ghost" size="icon" className="md:hidden mr-2 -ml-2" onClick={() => setActiveChannelId(null)}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h3 className="font-semibold">{activeChannelName}</h3>
              {isGroup && <span className="ml-2 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">Group</span>}
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
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <MessageSquareOff className="h-12 w-12 mb-4 text-slate-300 dark:text-slate-700" />
            <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400">Your Messages</h3>
            <p className="text-sm mt-1 max-w-sm">Select a conversation from the sidebar or start a new one to begin chatting.</p>
          </div>
        )}
      </div>
    </div>
  )
}
