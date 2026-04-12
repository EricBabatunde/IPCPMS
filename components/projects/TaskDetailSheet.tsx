"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import {
  MessageSquare,
  Calendar,
  Tag,
  Flag,
  Loader2,
  Send,
  MoreVertical,
  Edit2
} from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useSession } from "next-auth/react"

interface TaskDetailSheetProps {
  task: any // eslint-disable-line @typescript-eslint/no-explicit-any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailSheet({ task, open, onOpenChange }: TaskDetailSheetProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [description, setDescription] = useState(task.description || "")
  const [commentContent, setCommentContent] = useState("")

  const { data: comments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ["tasks", task.id, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${task.id}/comments`)
      if (!res.ok) throw new Error("Failed to fetch comments")
      return res.json()
    },
    enabled: open,
  })

  const updateDescMutation = useMutation({
    mutationFn: async (newDesc: string) => {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: newDesc }),
      })
      if (!res.ok) throw new Error("Failed to update description")
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["projects", task.projectId, "tasks"], (old: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!old) return old
        return old.map((t: any) => t.id === task.id ? { ...t, description: data.description } : t) // eslint-disable-line @typescript-eslint/no-explicit-any
      })
      setIsEditingDesc(false)
    },
  })

  const postCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error("Failed to post comment")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", task.id, "comments"] })
      setCommentContent("")
    },
  })

  const handleSaveDesc = () => {
    updateDescMutation.mutate(description)
  }

  const handlePostComment = () => {
    if (!commentContent.trim()) return
    postCommentMutation.mutate(commentContent)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl flex flex-col p-0">
        <SheetHeader className="p-6 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <SheetTitle className="text-xl font-bold">{task.title}</SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                <span>In list <strong className="text-slate-900 dark:text-slate-100">{task.status.replace("_", " ")}</strong></span>
              </SheetDescription>
            </div>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 py-4 text-sm">
            <div className="space-y-1">
              <span className="text-xs text-slate-500">Assignee</span>
              <div className="flex items-center gap-2 font-medium">
                <UserAvatar user={task.assignee} className="h-6 w-6" />
                {task.assignee?.name || "Unassigned"}
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="text-xs text-slate-500">Due Date</span>
              <div className="flex items-center gap-2 font-medium">
                <Calendar className="h-4 w-4 text-slate-400" />
                {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "No date"}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-500">Priority</span>
              <div className="flex items-center gap-2 font-medium">
                <Flag className={`h-4 w-4 ${task.priority === "HIGH" ? "text-red-500" : task.priority === "MEDIUM" ? "text-blue-500" : "text-slate-500"}`} />
                <span className="capitalize">{task.priority.toLowerCase()}</span>
              </div>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-8">
            {/* Description */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4" /> Description
                </h3>
                {!isEditingDesc && (
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setIsEditingDesc(true)}>
                    <Edit2 className="h-3 w-3 mr-1" /> Edit
                  </Button>
                )}
              </div>
              
              {isEditingDesc ? (
                <div className="space-y-2">
                  <Textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[100px] resize-y"
                    placeholder="Add a more detailed description..."
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveDesc} disabled={updateDescMutation.isPending}>
                      {updateDescMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin"/>}
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      setIsEditingDesc(false)
                      setDescription(task.description || "")
                    }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  className={`text-sm rounded-md ${!task.description ? 'text-slate-500 italic bg-slate-50 dark:bg-slate-900/50 p-3 p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900' : 'text-slate-700 dark:text-slate-300'}`}
                  onClick={() => !task.description && setIsEditingDesc(true)}
                >
                  {task.description || "Add a more detailed description..."}
                </div>
              )}
            </div>

            <Separator />

            {/* Comments */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Activity
              </h3>

              <div className="flex gap-3">
                <UserAvatar user={(session?.user as any) || null} className="h-8 w-8 mt-1" />
                <div className="flex-1 space-y-2">
                  <Textarea 
                    placeholder="Write a comment..."
                    className="min-h-[80px] text-sm resize-none"
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                  />
                  <Button 
                    size="sm" 
                    onClick={handlePostComment}
                    disabled={!commentContent.trim() || postCommentMutation.isPending}
                  >
                    {postCommentMutation.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin"/> : <Send className="mr-2 h-3 w-3" />}
                    Comment
                  </Button>
                </div>
              </div>

              <div className="pt-4 space-y-5">
                {isLoadingComments ? (
                  <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-center text-slate-500 italic py-4">No comments yet</p>
                ) : (
                  comments.map((comment: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <div key={comment.id} className="flex gap-3">
                      <UserAvatar user={comment.user} className="h-8 w-8" />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{comment.user.name}</span>
                          <span className="text-xs text-slate-500">{format(new Date(comment.createdAt), "MMM d 'at' h:mm a")}</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-3 text-sm text-slate-700 dark:text-slate-300">
                          {comment.content}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
