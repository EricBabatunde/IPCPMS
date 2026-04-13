"use client"

import { useQuery } from "@tanstack/react-query"
import { Hash, Loader2 } from "lucide-react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { usePresence } from "@/hooks/usePresence"

interface ConversationListProps {
  currentUserId: string
  activeChannelId: string | null
  onSelectChannel: (id: string, isGroup: boolean, name: string) => void
}

export function ConversationList({ currentUserId, activeChannelId, onSelectChannel }: ConversationListProps) {
  const { data: conversations, isLoading: isLoadingDMs } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await fetch("/api/messages")
      if (!res.ok) throw new Error("Failed to fetch conversations")
      return res.json()
    },
  })

  // Group queries to check membership
  const { data: groups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await fetch("/api/groups")
      if (!res.ok) throw new Error("Failed to fetch groups")
      return res.json()
    },
  })

  return (
    <div className="flex h-full w-full sm:w-80 flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="font-semibold text-lg">Messages</h2>
      </div>

      <Tabs defaultValue="direct" className="flex-1 flex flex-col pt-4">
        <div className="px-4">
          <TabsList className="w-full">
            <TabsTrigger value="direct" className="flex-1">Direct</TabsTrigger>
            <TabsTrigger value="groups" className="flex-1">Groups</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 mt-4 px-2">
          <TabsContent value="direct" className="m-0 space-y-1">
            {isLoadingDMs ? (
              <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin text-slate-400" /></div>
            ) : conversations?.length === 0 ? (
              <p className="text-sm text-center text-slate-500 py-4">No conversations yet</p>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              conversations?.map((conv: any) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const otherMember = conv.members.find((m: any) => m.userId !== currentUserId)?.user
                if (!otherMember) return null

                const lastMessage = conv.messages?.[0]
                const isActive = activeChannelId === conv.id

                return (
                  <button
                    key={conv.id}
                    onClick={() => onSelectChannel(conv.id, false, otherMember.name)}
                    className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                  >
                    <div className="relative">
                      <UserAvatar user={otherMember} className="h-10 w-10" />
                      <PresenceIndicator userId={otherMember.id} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate dark:text-slate-200">{otherMember.name}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {lastMessage ? lastMessage.content || "Sent a file" : "Start chatting..."}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </TabsContent>

          <TabsContent value="groups" className="m-0 space-y-1">
            {isLoadingGroups ? (
              <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin text-slate-400" /></div>
            ) : groups?.length === 0 ? (
              <p className="text-sm text-center text-slate-500 py-4">No groups yet</p>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              groups?.map((group: any) => {
                const lastMessage = group.messages?.[0]
                const isActive = activeChannelId === group.id

                return (
                  <button
                    key={group.id}
                    onClick={() => onSelectChannel(group.id, true, group.name)}
                    className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                  >
                    <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                      <Hash className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate dark:text-slate-200">{group.name}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {lastMessage ? lastMessage.content || "Sent a file" : "Start chatting..."}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}

function PresenceIndicator({ userId }: { userId: string }) {
  const isOnline = usePresence(userId)
  return (
    <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-900 ${isOnline ? "bg-green-500" : "bg-slate-400"}`} />
  )
}
