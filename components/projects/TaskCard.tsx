"use client"

import { Draggable } from "@hello-pangea/dnd"
import { MessageSquare, Calendar } from "lucide-react"
import { format } from "date-fns"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { Badge } from "@/components/ui/badge"
import type { KanbanTask } from "./KanbanBoard"

// ─── Types ────────────────────────────────────────────────────────────────────

interface DraggableTaskCardProps {
  task: KanbanTask
  index: number
  onClick?: () => void
}

interface TaskCardProps {
  task: KanbanTask
  onClick?: () => void
}

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  LOW:      { label: "Low",      color: "#94a3b8", bg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  MEDIUM:   { label: "Medium",   color: "#3b82f6", bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  HIGH:     { label: "High",     color: "#f97316", bg: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  CRITICAL: { label: "Critical", color: "#ef4444", bg: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
} as const

// ─── DraggableTaskCard (wraps Draggable) ──────────────────────────────────────

export function DraggableTaskCard({ task, index, onClick }: DraggableTaskCardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <>
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              ...provided.draggableProps.style,
              // Remove any applied rotation during drag
            }}
          >
            {snapshot.isDragging ? (
              // Ghost card shown at original position while dragging
              <div className="h-[140px] w-full rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 opacity-60" />
            ) : (
              <TaskCard task={task} onClick={onClick} />
            )}
          </div>
          {/* Render the actual card in the drag overlay position separately */}
          {snapshot.isDragging && (
            <div className="rounded-lg ring-2 ring-primary/50 shadow-2xl opacity-0 pointer-events-none">
              <TaskCard task={task} />
            </div>
          )}
        </>
      )}
    </Draggable>
  )
}

// ─── TaskCard (pure display) ──────────────────────────────────────────────────

export function TaskCard({ task, onClick }: TaskCardProps) {
  const priority = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.MEDIUM

  const isDueSoon = task.dueDate && (() => {
    const due = new Date(task.dueDate!)
    const now = new Date()
    const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays <= 2 && diffDays >= 0
  })()

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE"

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer border-slate-200 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 dark:border-slate-700/60 dark:bg-slate-900 overflow-hidden group"
    >
      {/* Priority left-edge accent bar */}
      <div
        className="absolute left-0 top-0 h-full w-[3px] rounded-l-lg"
        style={{ backgroundColor: priority.color }}
      />

      <CardHeader className="p-3 pb-0 pl-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {/* Priority badge */}
            <Badge
              variant="outline"
              className={`border-transparent px-1.5 py-0 text-[10px] font-semibold leading-none ${priority.bg}`}
            >
              {priority.label}
            </Badge>
            {/* "Blocked" tag badge — shown when any tag label is "blocked" */}
            {task.tags?.some((tag) => tag.label.toLowerCase() === "blocked") && (
              <Badge
                variant="outline"
                className="border-red-300 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-300 px-1.5 py-0 text-[10px] font-semibold leading-none"
              >
                🚫 Blocked
              </Badge>
            )}
            {/* Other tags (max 2, skip the "blocked" tag since we display it separately) */}
            {task.tags?.filter((tag) => tag.label.toLowerCase() !== "blocked").slice(0, 2).map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="px-1.5 py-0 text-[10px] leading-none"
                style={{ borderColor: tag.color + "66", color: tag.color }}
              >
                {tag.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Title */}
        <h4 className="mt-2 text-sm font-medium leading-snug text-slate-900 dark:text-slate-100 line-clamp-2">
          {task.title}
        </h4>
      </CardHeader>

      <CardContent className="p-3 pt-2 pl-4">
        {/* Description preview */}
        {task.description && (
          <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
            {task.description}
          </p>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          {/* Left meta */}
          <div className="flex items-center gap-2.5">
            {task.dueDate && (
              <div
                className={[
                  "flex items-center gap-1",
                  isOverdue ? "text-red-500 font-medium" : isDueSoon ? "text-amber-500 font-medium" : "",
                ].join(" ")}
              >
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(task.dueDate), "MMM d")}</span>
              </div>
            )}
            {(task._count?.comments ?? 0) > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{task._count.comments}</span>
              </div>
            )}
          </div>

          {/* Right: Multi-assignee avatars */}
          <div className="flex items-center">
            {task.assignees?.length > 0 && (
              <div className="flex items-center -space-x-2">
                {task.assignees.slice(0, 2).map((assignee) => (
                  <UserAvatar
                    key={assignee.id}
                    user={assignee}
                    className="h-5 w-5 border-2 border-white dark:border-slate-900 ring-0"
                  />
                ))}
                {task.assignees.length > 2 && (
                  <div className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[9px] font-bold text-slate-600 dark:border-slate-900 dark:bg-slate-700 dark:text-slate-300">
                    +{task.assignees.length - 2}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
