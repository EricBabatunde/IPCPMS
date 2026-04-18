"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { MessageSquare, Calendar, MoreHorizontal } from "lucide-react"
import { format } from "date-fns"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { Badge } from "@/components/ui/badge"

interface TaskProps {
  task: any // eslint-disable-line @typescript-eslint/no-explicit-any
  onClick?: () => void
}

export function SortableTaskCard({ task, onClick }: TaskProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  })

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-[140px] w-full rounded-lg border-2 border-primary/50 bg-primary/10 opacity-50"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} onClick={onClick} />
    </div>
  )
}

export function TaskCard({ task, onClick }: TaskProps) {
  const priorityColor = {
    LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    HIGH: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  }[task.priority as string] || "bg-slate-100 text-slate-700"

  return (
    <Card 
      onClick={onClick}
      className="cursor-pointer border-slate-200 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800"
    >
      <CardHeader className="p-3 pb-0">
        <div className="flex items-start justify-between">
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className={`border-transparent px-1.5 py-0.5 text-[10px] font-medium leading-none ${priorityColor}`}>
              {task.priority}
            </Badge>
            {task.tags?.slice(0, 2).map((tag: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
              <Badge key={tag.id} variant="outline" className="px-1.5 py-0.5 text-[10px] leading-none">
                {tag.label}
              </Badge>
            ))}
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
        <h4 className="mt-2 text-sm font-medium leading-tight text-slate-900 dark:text-slate-100">
          {task.title}
        </h4>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        {task.description && (
          <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
            {task.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(new Date(task.dueDate), "MMM d")}</span>
              </div>
            )}
            {task._count?.comments > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{task._count.comments}</span>
              </div>
            )}
          </div>
          <div className="flex items-center -space-x-2">
            {task.assignees?.slice(0, 2).map((assignee: any) => (
              <UserAvatar key={assignee.id} user={assignee} className="h-6 w-6 border-2 border-white dark:border-slate-950" />
            ))}
            {task.assignees?.length > 2 && (
              <div className="h-6 w-6 rounded-full border-2 border-white dark:border-slate-950 bg-slate-100 flex items-center justify-center text-[10px] font-medium z-10 dark:bg-slate-800">
                +{task.assignees.length - 2}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
