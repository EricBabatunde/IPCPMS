"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { DragDropContext, DropResult } from "@hello-pangea/dnd"
import { TaskStatus } from "@prisma/client"

import { KanbanColumn } from "./KanbanColumn"
import { TaskDetailSheet } from "./TaskDetailSheet"
import { CreateTaskModal } from "./CreateTaskModal"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Assignee {
  id: string
  name: string
  image: string | null
}

export interface TaskTag {
  id: string
  label: string
  color: string
}

export interface KanbanTask {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: string
  position: number
  dueDate: string | null
  completedAt: string | null
  projectId: string
  creatorId: string
  assignees: Assignee[]
  tags: TaskTag[]
  _count: { comments: number }
}

// ─── Column Config ────────────────────────────────────────────────────────────

export const COLUMNS: { id: TaskStatus; title: string; accentColor: string }[] = [
  { id: "TODO",        title: "To Do",       accentColor: "#3b82f6" }, // blue
  { id: "IN_PROGRESS", title: "In Progress", accentColor: "#f59e0b" }, // amber
  { id: "IN_REVIEW",   title: "In Review",   accentColor: "#8b5cf6" }, // violet
  { id: "DONE",        title: "Done",        accentColor: "#22c55e" }, // green
]

// ─── Positioning helpers ──────────────────────────────────────────────────────

function calcNewPosition(columnTasks: KanbanTask[], destinationIndex: number): number {
  const sorted = [...columnTasks].sort((a, b) => a.position - b.position)

  if (sorted.length === 0) return 1024

  // Dropped at the top
  if (destinationIndex === 0) {
    return sorted[0].position - 1024
  }

  // Dropped at the bottom (after the last item)
  if (destinationIndex >= sorted.length) {
    return sorted[sorted.length - 1].position + 1024
  }

  // Dropped between two tasks
  const above = sorted[destinationIndex - 1]
  const below = sorted[destinationIndex]
  return (above.position + below.position) / 2
}

// ─── Component ────────────────────────────────────────────────────────────────

export function KanbanBoard({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient()

  // Local UI state
  const [tasks, setTasks] = useState<KanbanTask[]>([])
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null)
  const [createTaskColumn, setCreateTaskColumn] = useState<string | null>(null)

  // "Source of Truth" lock — prevents the server-sync useEffect from
  // overwriting optimistic state while a mutation is in-flight.
  const isMutatingRef = useRef(false)

  // ── Server Fetch ────────────────────────────────────────────────────────────
  const { data: serverTasks = [], isLoading } = useQuery<KanbanTask[]>({
    queryKey: ["projects", projectId, "tasks"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/tasks`)
      if (!res.ok) throw new Error("Failed to fetch tasks")
      return res.json()
    },
    // Keep data fresh but not too aggressive during D&D sessions
    staleTime: 30_000,
  })

  // ── Sync server → local (guarded by isMutatingRef) ─────────────────────────
  useEffect(() => {
    if (!isMutatingRef.current) {
      setTasks([...serverTasks].sort((a, b) => a.position - b.position))
    }
  }, [serverTasks])

  // ── Mutation ────────────────────────────────────────────────────────────────
  const updateTaskMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<KanbanTask> & { completedAt?: string | null }
    }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update task")
      return res.json() as Promise<KanbanTask>
    },

    onMutate: async ({ id, data }) => {
      // Acquire lock immediately (synchronous)
      isMutatingRef.current = true

      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["projects", projectId, "tasks"] })

      // Snapshot for rollback
      const previousTasks = queryClient.getQueryData<KanbanTask[]>([
        "projects",
        projectId,
        "tasks",
      ])

      // Update the cache snapshot too (so DevTools stay consistent)
      queryClient.setQueryData<KanbanTask[]>(
        ["projects", projectId, "tasks"],
        (old) => old?.map((t) => (t.id === id ? { ...t, ...data } : t)) ?? old
      )

      return { previousTasks }
    },

    onError: (_err, _vars, context) => {
      // Roll back on failure
      if (context?.previousTasks) {
        queryClient.setQueryData(
          ["projects", projectId, "tasks"],
          context.previousTasks
        )
        setTasks(
          [...context.previousTasks].sort((a, b) => a.position - b.position)
        )
      }
    },

    onSuccess: (updatedTask) => {
      // Merge the authoritative server response into local state
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
      )
    },

    onSettled: () => {
      // Release lock, then let the next query sync take over
      isMutatingRef.current = false
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "tasks"] })
    },
  })

  // ── Drag End Handler ────────────────────────────────────────────────────────
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, draggableId } = result

      // Dropped outside any droppable zone
      if (!destination) return

      const sourceCol = source.droppableId as TaskStatus
      const destCol = destination.droppableId as TaskStatus
      const sourceIdx = source.index
      const destIdx = destination.index

      // No movement
      if (sourceCol === destCol && sourceIdx === destIdx) return

      // Atomically compute new state
      setTasks((prev) => {
        const sorted = [...prev].sort((a, b) => a.position - b.position)

        // Pull the dragged task
        const draggedTask = sorted.find((t) => t.id === draggableId)
        if (!draggedTask) return prev

        // Build destination column task list (excluding the dragged task)
        const destColTasks = sorted
          .filter((t) => t.status === destCol && t.id !== draggableId)
          .sort((a, b) => a.position - b.position)

        const newPosition = calcNewPosition(destColTasks, destIdx)

        // Optimistic completedAt
        let optimisticCompletedAt = draggedTask.completedAt
        if (destCol === "DONE" && sourceCol !== "DONE") {
          optimisticCompletedAt = new Date().toISOString()
        } else if (destCol !== "DONE" && sourceCol === "DONE") {
          optimisticCompletedAt = null
        }

        const updatedTask: KanbanTask = {
          ...draggedTask,
          status: destCol,
          position: newPosition,
          completedAt: optimisticCompletedAt,
        }

        // Fire the mutation (the ref lock is set inside onMutate)
        updateTaskMutation.mutate({
          id: draggableId,
          data: {
            status: destCol,
            position: newPosition,
          },
        })

        return sorted.map((t) => (t.id === draggableId ? updatedTask : t))
      })
    },
    [updateTaskMutation]
  )

  // ── Render ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading board…</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex h-full gap-4 overflow-x-auto pb-6 pr-2">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={tasks
                .filter((t) => t.status === col.id)
                .sort((a, b) => a.position - b.position)}
              onTaskClick={(task) => setSelectedTask(task)}
              onAddTask={(status) => setCreateTaskColumn(status)}
            />
          ))}
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => {
            if (!open) setSelectedTask(null)
          }}
          onDeleted={(taskId) => {
            setSelectedTask(null)
            setTasks((prev) => prev.filter((t) => t.id !== taskId))
            queryClient.invalidateQueries({ queryKey: ["projects", projectId, "tasks"] })
          }}
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
