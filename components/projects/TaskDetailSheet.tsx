"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import {
  MessageSquare,
  Calendar as CalendarIcon,
  Tag,
  Flag,
  Loader2,
  Send,
  Trash2,
  Check,
  ChevronsUpDown,
  X,
} from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Member {
  id: string
  userId: string
  user: { id: string; name: string; image: string | null }
}

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  LOW:      { label: "Low",      color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-900/20",   border: "border-blue-300 dark:border-blue-700" },
  MEDIUM:   { label: "Medium",   color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-300 dark:border-yellow-700" },
  HIGH:     { label: "High",     color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-300 dark:border-orange-700" },
  CRITICAL: { label: "Critical", color: "text-red-600",    bg: "bg-red-50 dark:bg-red-900/20",     border: "border-red-300 dark:border-red-700" },
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TaskDetailSheetProps {
  task: any // eslint-disable-line @typescript-eslint/no-explicit-any
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: (taskId: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskDetailSheet({ task, open, onOpenChange, onDeleted }: TaskDetailSheetProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  // ── Local editable state (mirrors task prop, reset when task changes) ────────
  const [title, setTitle]             = useState(task.title)
  const [description, setDescription] = useState(task.description || "")
  const [priority, setPriority]       = useState<string>(task.priority)
  const [dueDate, setDueDate]         = useState<Date | undefined>(task.dueDate ? new Date(task.dueDate) : undefined)
  const [assigneeIds, setAssigneeIds] = useState<string[]>((task.assignees ?? []).map((a: any) => a.id)) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [commentContent, setCommentContent] = useState("")
  const [datePopoverOpen, setDatePopoverOpen]   = useState(false)
  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false)
  const [isEditingDesc, setIsEditingDesc] = useState(false)

  // Sync if a different task is selected while the sheet is already open
  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description || "")
    setPriority(task.priority)
    setDueDate(task.dueDate ? new Date(task.dueDate) : undefined)
    setAssigneeIds((task.assignees ?? []).map((a: any) => a.id)) // eslint-disable-line @typescript-eslint/no-explicit-any
    setCommentContent("")
    setIsEditingDesc(false)
  }, [task.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch project members for the assignee combobox ────────────────────────
  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["projectMembers", task.projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${task.projectId}`)
      if (!res.ok) throw new Error("Failed to fetch project")
      const data = await res.json()
      return data.members ?? []
    },
    enabled: open,
  })

  // ── Fetch comments ──────────────────────────────────────────────────────────
  const { data: comments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ["tasks", task.id, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${task.id}/comments`)
      if (!res.ok) throw new Error("Failed to fetch comments")
      return res.json()
    },
    enabled: open,
  })

  // ── Generic PATCH helper ────────────────────────────────────────────────────
  const patchMutation = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Failed to update task")
      }
      return res.json()
    },
    onSuccess: (updated: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(
        ["projects", task.projectId, "tasks"],
        (old: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
          old ? old.map((t: any) => (t.id === task.id ? { ...t, ...updated } : t)) : old // eslint-disable-line @typescript-eslint/no-explicit-any
      )
      queryClient.invalidateQueries({ queryKey: ["tasks", task.projectId] })
    },
    onError: (err: Error) => {
      toast.error("Update failed", { description: err.message })
    },
  })

  // ── Title: inline edit with blur-to-save ────────────────────────────────────
  const titleRef = useRef<HTMLInputElement>(null)
  const handleTitleBlur = () => {
    const trimmed = title.trim()
    if (!trimmed) { setTitle(task.title); return }
    if (trimmed !== task.title) patchMutation.mutate({ title: trimmed })
  }

  // ── Priority save ───────────────────────────────────────────────────────────
  const handlePriorityChange = (val: string) => {
    setPriority(val)
    patchMutation.mutate({ priority: val })
  }

  // ── Due date save ────────────────────────────────────────────────────────────
  const handleDateSelect = (date: Date | undefined) => {
    setDueDate(date)
    setDatePopoverOpen(false)
    patchMutation.mutate({ dueDate: date ? date.toISOString() : null })
  }

  // ── Assignees save ───────────────────────────────────────────────────────────
  const toggleAssignee = useCallback((userId: string) => {
    const next = assigneeIds.includes(userId)
      ? assigneeIds.filter((id) => id !== userId)
      : [...assigneeIds, userId]
    setAssigneeIds(next)
    patchMutation.mutate({ assigneeIds: next })
  }, [assigneeIds, patchMutation]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Description save ────────────────────────────────────────────────────────
  const handleSaveDesc = () => {
    patchMutation.mutate({ description })
    setIsEditingDesc(false)
  }

  // ── Comment ──────────────────────────────────────────────────────────────────
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

  // ── Delete ───────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete task")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", task.projectId] })
      onDeleted?.(task.id)
      onOpenChange(false)
      toast.success("Task deleted")
    },
    onError: () => toast.error("Failed to delete task"),
  })

  // ── Derived display data ──────────────────────────────────────────────────────
  const priorityConf = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.MEDIUM
  const assignedMembers = members.filter((m) => assigneeIds.includes(m.userId))
  const unassignedMembers = members.filter((m) => !assigneeIds.includes(m.userId))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl flex flex-col p-0">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <SheetHeader className="p-6 pb-0 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3">
            {/* Inline-editable title */}
            <Input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="text-xl font-bold border-transparent shadow-none px-0 focus-visible:border-primary focus-visible:shadow-sm h-auto py-1 leading-snug"
            />
            {/* Delete button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &ldquo;{task.title}&rdquo; and all its comments. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <SheetDescription className="mt-0.5 mb-4">
            In list <strong className="text-slate-900 dark:text-slate-100">{task.status.replace(/_/g, " ")}</strong>
          </SheetDescription>

          {/* ── Meta fields row ──────────────────────────────────────── */}
          <div className="flex flex-wrap gap-x-6 gap-y-4 py-4 text-sm">

            {/* Assignees multi-select */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-500 font-medium">Assignees</span>
              <div className="flex items-center gap-2 flex-wrap">
                {assignedMembers.length > 0 ? (
                  assignedMembers.map((m) => (
                    <button
                      key={m.userId}
                      type="button"
                      title={`Remove ${m.user.name}`}
                      onClick={() => toggleAssignee(m.userId)}
                      className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors group"
                    >
                      <UserAvatar user={m.user} className="h-4 w-4" />
                      {m.user.name}
                      <X className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs italic">Unassigned</span>
                )}
                {/* Add assignee combobox */}
                {unassignedMembers.length > 0 && (
                  <Popover open={memberPopoverOpen} onOpenChange={setMemberPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-6 px-2 text-xs gap-1">
                        <ChevronsUpDown className="h-3 w-3" /> Add
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-52 p-1" align="start">
                      {unassignedMembers.map((m) => (
                        <button
                          key={m.userId}
                          type="button"
                          onClick={() => { toggleAssignee(m.userId); setMemberPopoverOpen(false) }}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <UserAvatar user={m.user} className="h-6 w-6" />
                          {m.user.name}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            {/* Due Date picker */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-500 font-medium">Due Date</span>
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("h-7 gap-1.5 text-xs font-normal", !dueDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dueDate ? format(dueDate, "MMM d, yyyy") : "Set date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                  {dueDate && (
                    <div className="p-2 border-t">
                      <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => handleDateSelect(undefined)}>
                        Clear date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Priority select */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-500 font-medium">Priority</span>
              <Select value={priority} onValueChange={handlePriorityChange}>
                <SelectTrigger className={cn("h-7 w-32 text-xs gap-1.5 border", priorityConf.border, priorityConf.bg)}>
                  <Flag className={cn("h-3.5 w-3.5", priorityConf.color)} />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([key, conf]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      <span className="flex items-center gap-1.5">
                        <Flag className={cn("h-3.5 w-3.5", conf.color)} />
                        {conf.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Completed At — shown when task is DONE */}
            {task.completedAt && (
              <div className="space-y-1.5">
                <span className="text-xs text-slate-500 font-medium">Completed On</span>
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-medium">
                  <Check className="h-3.5 w-3.5" />
                  {format(new Date(task.completedAt), "MMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
            )}
          </div>
        </SheetHeader>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-8">

            {/* Description */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4" /> Description
                </h3>
                {!isEditingDesc && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsEditingDesc(true)}>
                    Edit
                  </Button>
                )}
              </div>

              {isEditingDesc ? (
                <div className="space-y-2">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[100px] resize-y text-sm"
                    placeholder="Add a more detailed description..."
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveDesc} disabled={patchMutation.isPending}>
                      {patchMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setIsEditingDesc(false); setDescription(task.description || "") }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    "text-sm rounded-md",
                    !description
                      ? "text-slate-500 italic bg-slate-50 dark:bg-slate-900/50 p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900"
                      : "text-slate-700 dark:text-slate-300 whitespace-pre-wrap"
                  )}
                  onClick={() => !description && setIsEditingDesc(true)}
                >
                  {description || "Add a more detailed description..."}
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
                <UserAvatar user={(session?.user as any) || null} className="h-8 w-8 mt-1" /> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Write a comment..."
                    className="min-h-[80px] text-sm resize-none"
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={() => { if (commentContent.trim()) postCommentMutation.mutate(commentContent) }}
                    disabled={!commentContent.trim() || postCommentMutation.isPending}
                  >
                    {postCommentMutation.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Send className="mr-2 h-3 w-3" />}
                    Comment
                  </Button>
                </div>
              </div>

              <div className="pt-2 space-y-4">
                {isLoadingComments ? (
                  <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-center text-slate-500 italic py-4">No comments yet</p>
                ) : (
                  comments.map((comment: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <div key={comment.id} className="flex gap-3">
                      <UserAvatar user={comment.author} className="h-8 w-8" />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{comment.author.name}</span>
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
