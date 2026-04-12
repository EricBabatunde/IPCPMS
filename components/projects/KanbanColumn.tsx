"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SortableTaskCard } from "./TaskCard"

interface ColumnProps {
  column: { id: string; title: string }
  tasks: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
  onTaskClick: (task: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
  onAddTask: (status: string) => void
}

export function Column({ column, tasks, onTaskClick, onAddTask }: ColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  })

  const taskIds = tasks.map((t) => t.id)

  return (
    <div className="flex w-80 flex-shrink-0 flex-col rounded-xl bg-slate-100 dark:bg-slate-900/50">
      <div className="flex items-center justify-between p-3 font-semibold text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <span>{column.title}</span>
          <span className="flex h-5 items-center justify-center rounded-full bg-slate-200 px-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
          onClick={() => onAddTask(column.id)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={setNodeRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto p-2 min-h-[150px]"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
