"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { TaskStatus } from "@prisma/client"

import { Column } from "./KanbanColumn"
import { TaskCard } from "./TaskCard"
import { TaskDetailSheet } from "./TaskDetailSheet"
import { CreateTaskModal } from "./CreateTaskModal"

interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: string
  position: number
  dueDate: string | null
  assignee?: { id: string; name: string; image: string | null } | null
  tags: { id: string; name: string; color: string }[]
  _count: { comments: number }
}

const COLUMNS = [
  { id: "TODO", title: "To Do" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "IN_REVIEW", title: "Review" },
  { id: "DONE", title: "Done" },
]

export function KanbanBoard({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [selectedTaskForSheet, setSelectedTaskForSheet] = useState<Task | null>(null)
  const [createTaskColumn, setCreateTaskColumn] = useState<string | null>(null)

  const { data: serverTasks = [], isLoading } = useQuery({
    queryKey: ["projects", projectId, "tasks"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/tasks`)
      if (!res.ok) throw new Error("Failed to fetch tasks")
      return res.json() as Promise<Task[]>
    },
  })

  // Optimistic tasks state
  const [tasks, setTasks] = useState<Task[]>([])

  // Sync server state with local state when serverTasks arrive
  useMemo(() => {
    if (serverTasks.length > 0) {
      setTasks([...serverTasks].sort((a, b) => a.position - b.position))
    } else if (serverTasks.length === 0) {
      setTasks([])
    }
  }, [serverTasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Task> }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update task")
      return res.json()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "tasks"] })
    },
  })

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find((t) => t.id === active.id)
    if (task) setActiveTask(task)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveTask = active.data.current?.type === "Task"
    const isOverTask = over.data.current?.type === "Task"
    const isOverColumn = over.data.current?.type === "Column"

    if (!isActiveTask) return

    // Dropping a task over another task
    if (isActiveTask && isOverTask) {
      setTasks((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId)
        const overIndex = prev.findIndex((t) => t.id === overId)

        if (prev[activeIndex].status !== prev[overIndex].status) {
          const newTasks = [...prev]
          newTasks[activeIndex] = { ...newTasks[activeIndex], status: prev[overIndex].status }
          return arrayMove(newTasks, activeIndex, overIndex)
        }

        return arrayMove(prev, activeIndex, overIndex)
      })
    }

    // Dropping a task over a column directly (empty column)
    if (isActiveTask && isOverColumn) {
      setTasks((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId)
        const newTasks = [...prev]
        newTasks[activeIndex] = { ...newTasks[activeIndex], status: overId as TaskStatus }
        return arrayMove(newTasks, activeIndex, activeIndex)
      })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const activeIndex = tasks.findIndex((t) => t.id === activeId)

    if (activeIndex !== -1) {
      const currentTask = tasks[activeIndex]
      const targetColumn = currentTask.status

      const columnTasks = tasks.filter((t) => t.status === targetColumn)
      const taskIndexInColumn = columnTasks.findIndex((t) => t.id === activeId)

      let newPosition = 1024
      if (columnTasks.length === 1) {
        newPosition = 1024
      } else if (taskIndexInColumn === 0) {
        newPosition = columnTasks[1].position / 2
      } else if (taskIndexInColumn === columnTasks.length - 1) {
        newPosition = columnTasks[taskIndexInColumn - 1].position + 1024
      } else {
        const prevPos = columnTasks[taskIndexInColumn - 1].position
        const nextPos = columnTasks[taskIndexInColumn + 1].position
        newPosition = (prevPos + nextPos) / 2
      }

      // Sync to DB
      updateTaskMutation.mutate({
        id: currentTask.id,
        data: { status: currentTask.status, position: newPosition },
      })
    }
  }

  if (isLoading) {
    return <div className="h-96 flex items-center justify-center">Loading board...</div>
  }

  return (
    <>
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              column={col}
              tasks={tasks.filter((task) => task.status === col.id)}
              onTaskClick={(task) => setSelectedTaskForSheet(task)}
              onAddTask={(status) => setCreateTaskColumn(status)}
            />
          ))}

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {selectedTaskForSheet && (
        <TaskDetailSheet
          task={selectedTaskForSheet}
          open={!!selectedTaskForSheet}
          onOpenChange={(open) => !open && setSelectedTaskForSheet(null)}
        />
      )}

      <CreateTaskModal
        open={!!createTaskColumn}
        onOpenChange={(open) => !open && setCreateTaskColumn(null)}
        projectId={projectId}
        defaultStatus={createTaskColumn || "TODO"}
      />
    </>
  )
}
