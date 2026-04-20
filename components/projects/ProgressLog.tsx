"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { formatDistanceToNow } from "date-fns"
import { Loader2, TrendingUp, Minus, TrendingDown, Send, BookOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EmptyState } from "@/components/shared/EmptyState"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// ─── Types ───────────────────────────────────────────────────────────────────

type LogType = "POSITIVE" | "NEUTRAL" | "NEGATIVE"

interface ProgressLogEntry {
  id: string
  content: string
  type: LogType
  createdAt: string
  user: { id: string; name: string; image: string | null }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const LOG_TYPES: {
  value: LogType
  label: string
  icon: React.ReactNode
  activeClass: string
  borderClass: string
  dotClass: string
}[] = [
  {
    value: "POSITIVE",
    label: "Positive Progress",
    icon: <TrendingUp className="h-4 w-4" />,
    activeClass: "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600",
    borderClass: "border-l-emerald-500",
    dotClass: "bg-emerald-500",
  },
  {
    value: "NEUTRAL",
    label: "No Progress",
    icon: <Minus className="h-4 w-4" />,
    activeClass: "bg-slate-500 text-white border-slate-500 hover:bg-slate-600",
    borderClass: "border-l-slate-400",
    dotClass: "bg-slate-400",
  },
  {
    value: "NEGATIVE",
    label: "Setback",
    icon: <TrendingDown className="h-4 w-4" />,
    activeClass: "bg-red-500 text-white border-red-500 hover:bg-red-600",
    borderClass: "border-l-red-500",
    dotClass: "bg-red-500",
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

interface ProgressLogProps {
  projectId: string
}

export function ProgressLog({ projectId }: ProgressLogProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const [content, setContent] = useState("")
  const [selectedType, setSelectedType] = useState<LogType | null>(null)

  const { data: logs = [], isLoading } = useQuery<ProgressLogEntry[]>({
    queryKey: ["progressLogs", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/logs`)
      if (!res.ok) throw new Error("Failed to fetch logs")
      return res.json()
    },
  })

  const submitMutation = useMutation({
    mutationFn: async ({ content, type }: { content: string; type: LogType }) => {
      const res = await fetch(`/api/projects/${projectId}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type }),
      })
      if (!res.ok) throw new Error("Failed to submit log")
      return res.json()
    },
    onSuccess: (newLog: ProgressLogEntry) => {
      queryClient.setQueryData<ProgressLogEntry[]>(
        ["progressLogs", projectId],
        (old) => (old ? [newLog, ...old] : [newLog])
      )
      setContent("")
      setSelectedType(null)
      const typeConfig = LOG_TYPES.find((t) => t.value === newLog.type)
      toast.success("Progress logged", {
        description: `Your ${typeConfig?.label.toLowerCase()} entry has been recorded.`,
      })
    },
    onError: () => {
      toast.error("Failed to submit log. Please try again.")
    },
  })

  const handleSubmit = () => {
    if (!content.trim() || !selectedType) return
    submitMutation.mutate({ content: content.trim(), type: selectedType })
  }

  const canSubmit = content.trim().length > 0 && selectedType !== null

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* ── Input Card ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-5 space-y-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          Daily Progress Entry
        </h3>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe what you worked on today, any challenges faced, or progress made…"
          className="min-h-[100px] resize-y text-sm"
        />

        {/* Type selector */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Progress Type</p>
          <div className="flex flex-wrap gap-2">
            {LOG_TYPES.map((t) => {
              const isActive = selectedType === t.value
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setSelectedType(isActive ? null : t.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
                    isActive
                      ? t.activeClass
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitMutation.isPending}
            size="sm"
            className="gap-1.5"
          >
            {submitMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Submit Log
          </Button>
        </div>
      </div>

      {/* ── Log Feed ───────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Log History
        </h3>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-8 w-8" />}
            title="No progress logs yet"
            description="Submit your first daily entry above to start building your engineering notebook."
          />
        ) : (
          <ScrollArea className="pr-2">
            <div className="space-y-3">
              {logs.map((log) => {
                const typeConfig = LOG_TYPES.find((t) => t.value === log.type)!
                const isOwn = log.user.id === session?.user?.id

                return (
                  <div
                    key={log.id}
                    className={cn(
                      "flex gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-4 border-l-4 shadow-sm transition-all",
                      typeConfig.borderClass
                    )}
                  >
                    <UserAvatar user={log.user} className="h-8 w-8 mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {isOwn ? "You" : log.user.name}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5",
                            log.type === "POSITIVE"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : log.type === "NEGATIVE"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", typeConfig.dotClass)} />
                          {typeConfig.label}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {log.content}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}
