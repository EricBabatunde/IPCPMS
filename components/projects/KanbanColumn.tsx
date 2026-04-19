"use client"

import { Droppable } from "@hello-pangea/dnd"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DraggableTaskCard } from "./TaskCard"
import type { KanbanTask } from "./KanbanBoard"

// ─── Types ────────────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  column: { id: string; title: string; accentColor: string }
  tasks: KanbanTask[]
  onTaskClick: (task: KanbanTask) => void
  onAddTask: (status: string) => void
}

// ─── Status labels ────────────────────────────────────────────────────────────

const STATUS_EMOJI: Record<string, string> = {
  TODO:        "📋",
  IN_PROGRESS: "⚡",
  IN_REVIEW:   "🔍",
  DONE:        "✅",
}

// ─── Component ────────────────────────────────────────────────────────────────

export function KanbanColumn({
  column,
  tasks,
  onTaskClick,
  onAddTask,
}: KanbanColumnProps) {
  return (
    <div className="flex w-72 flex-shrink-0 flex-col rounded-xl bg-slate-100 dark:bg-slate-900/60 overflow-hidden shadow-sm">
      {/* Column accent bar */}
      <div
        className="h-1 w-full flex-shrink-0"
        style={{ backgroundColor: column.accentColor }}
      />

      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none" aria-hidden>
            {STATUS_EMOJI[column.id]}
          </span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {column.title}
          </span>
          <span
            className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-medium"
            style={{
              backgroundColor: column.accentColor + "22", // 13% opacity
              color: column.accentColor,
            }}
          >
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
          onClick={() => onAddTask(column.id)}
          aria-label={`Add task to ${column.title}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Droppable zone */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={[
              "flex flex-1 flex-col gap-2 overflow-y-auto p-2 transition-colors duration-150",
              "min-h-[120px]", // always a valid drop target
              snapshot.isDraggingOver
                ? "bg-slate-200/60 dark:bg-slate-800/40"
                : "",
            ].join(" ")}
          >
            {tasks.map((task, index) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={() => onTaskClick(task)}
              />
            ))}
            {/* Placeholder preserves column height during drag */}
            {provided.placeholder}

            {/* Empty-state hint */}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700/60 py-8 text-center">
                <span className="text-2xl leading-none opacity-40">
                  {STATUS_EMOJI[column.id]}
                </span>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Drop tasks here
                </p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}
