"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, Loader2, MessageSquarePlus } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { UserAvatar } from "@/components/shared/UserAvatar"

interface StartConversationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserId: string
  onSelectConversation: (id: string, isGroup: boolean, name: string) => void
}

export function StartConversationModal({
  open,
  onOpenChange,
  currentUserId,
  onSelectConversation,
}: StartConversationModalProps) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", "search", debouncedSearch],
    queryFn: async () => {
      const url = debouncedSearch ? `/api/users?search=${encodeURIComponent(debouncedSearch)}` : "/api/users"
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch users")
      return res.json()
    },
    enabled: open,
  })

  // Exclude self from the search results
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredUsers = users?.filter((u: any) => u.id !== currentUserId) || []

  const startMutation = useMutation({
    mutationFn: async (recipientId: string) => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId }),
      })
      if (!res.ok) throw new Error("Failed to start conversation")
      return res.json()
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recipient = users.find((u: any) => u.id === variables)
      if (recipient) {
        onSelectConversation(data.id, false, recipient.name)
      }
      onOpenChange(false)
      setSearch("")
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Search for a team member to start a direct message.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-2 flex items-center">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="mt-4 max-h-[300px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No users found.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {filteredUsers.map((user: any) => (
                <button
                  key={user.id}
                  onClick={() => startMutation.mutate(user.id)}
                  disabled={startMutation.isPending}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <UserAvatar user={user} className="h-10 w-10" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  {startMutation.isPending && startMutation.variables === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  ) : (
                    <MessageSquarePlus className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
