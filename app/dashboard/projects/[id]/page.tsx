/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getPusherClient } from "@/lib/pusher-client"
import { useParams } from "next/navigation"
import {
  LayoutDashboard, ListTodo, Map, FolderOpen, Loader2, GraduationCap, BookOpen, ShieldCheck,
} from "lucide-react"
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend, ResponsiveContainer,
} from "recharts"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/shared/PageHeader"
import { KanbanBoard } from "@/components/projects/KanbanBoard"
import { MilestoneList } from "@/components/projects/MilestoneList"
import { ProjectFiles } from "@/components/projects/ProjectFiles"
import { ProgressLog } from "@/components/projects/ProgressLog"
import { MiniGantt, GanttItem } from "@/components/projects/MiniGantt"
import { TaskDetailSheet } from "@/components/projects/TaskDetailSheet"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// ─── Health bar segment config ─────────────────────────────────────────────────

const HEALTH_SEGMENTS = [
  { key: "done",       label: "Done",        color: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
  { key: "inProgress", label: "In Progress", color: "bg-blue-500",    text: "text-blue-700 dark:text-blue-400" },
  { key: "overdue",    label: "Overdue",     color: "bg-rose-500",    text: "text-rose-700 dark:text-rose-400" },
  { key: "todo",       label: "Todo",        color: "bg-slate-300 dark:bg-slate-600", text: "text-slate-500" },
]

// ─── Pie chart colours ─────────────────────────────────────────────────────────
const PIE_RADIUS = { inner: 38, outer: 62 }
const PIE_LABEL_MIN_PCT = 0.08

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const queryClient = useQueryClient()

  // Task detail sheet state — for Gantt task click
  const [sheetTask, setSheetTask] = useState<any | null>(null)
  const [sheetOpen, setSheetOpen]  = useState(false)

  // ── Project metadata ────────────────────────────────────────────────────────
  const { data: project, isLoading } = useQuery({
    queryKey: ["projects", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) throw new Error("Failed to fetch project")
      return res.json()
    },
  })

  // ── Project analytics ───────────────────────────────────────────────────────
  const { data: analytics } = useQuery({
    queryKey: ["projectAnalytics", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/analytics`)
      if (!res.ok) throw new Error("Failed to fetch analytics")
      return res.json()
    },
    enabled: !!projectId,
    refetchOnWindowFocus: true,
  })

  // ── Real-Time Analytics Sync ────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return

    const pusher = getPusherClient()
    const channelName = `private-project-${projectId}`
    
    // Subscribe to the project channel
    const channel = pusher.subscribe(channelName)

    const handleAnalyticsUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["projectAnalytics", projectId] })
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "tasks"] })
    }

    channel.bind("task-updated", handleAnalyticsUpdate)
    channel.bind("task-deleted", handleAnalyticsUpdate)
    channel.bind("milestone-updated", handleAnalyticsUpdate)
    channel.bind("milestone-deleted", handleAnalyticsUpdate)

    return () => {
      channel.unbind("task-updated", handleAnalyticsUpdate)
      channel.unbind("task-deleted", handleAnalyticsUpdate)
      channel.unbind("milestone-updated", handleAnalyticsUpdate)
      channel.unbind("milestone-deleted", handleAnalyticsUpdate)
      pusher.unsubscribe(channelName)
    }
  }, [projectId, queryClient])

  // ── Task fetch (for Gantt task sheet lookup) ────────────────────────────────
  const { data: allTasks = [] } = useQuery({
    queryKey: ["projects", projectId, "tasks"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/tasks`)
      if (!res.ok) throw new Error("Failed to fetch tasks")
      return res.json()
    },
    enabled: !!projectId,
  })

  // Handler: open TaskDetailSheet when a Gantt task circle is clicked
  const handleGanttTaskClick = (taskId: string) => {
    const found = allTasks.find((t: any) => t.id === taskId)
    if (found) { setSheetTask(found); setSheetOpen(true) }
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-2xl font-bold">Project Not Found</h2>
        <p className="text-slate-500">The project you are looking for does not exist or you don&apos;t have access.</p>
      </div>
    )
  }

  const health = analytics?.health
  const ganttItems: GanttItem[] = analytics?.gantt ?? []

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader
        title={project.name}
        description={project.description || "No description provided."}
      >
        <Badge variant={project.status === "COMPLETED" ? "default" : "secondary"} className="uppercase">
          {project.status.replace("_", " ")}
        </Badge>
        {project.courseCode && project.courseCode !== "none" && (
          <Badge variant="outline" className="gap-1.5 border-primary/30 text-primary bg-primary/5">
            <GraduationCap className="h-3.5 w-3.5" />
            {project.courseCode}
          </Badge>
        )}
      </PageHeader>

      <Tabs defaultValue="board" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mb-4 inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-auto mr-auto">
          <TabsTrigger value="overview"   className="gap-2"><LayoutDashboard className="h-4 w-4" /> Overview</TabsTrigger>
          <TabsTrigger value="board"      className="gap-2"><ListTodo className="h-4 w-4" /> Kanban Board</TabsTrigger>
          <TabsTrigger value="milestones" className="gap-2"><Map className="h-4 w-4" /> Milestones</TabsTrigger>
          <TabsTrigger value="files"      className="gap-2"><FolderOpen className="h-4 w-4" /> Files</TabsTrigger>
          <TabsTrigger value="logs"       className="gap-2"><BookOpen className="h-4 w-4" /> Progress Log</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW ────────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="mt-0 space-y-6 pb-6">

          {/* ── Segmented Health Bar ───────────────────────────────────────── */}
          {health && health.total > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Project Health</h3>
                <span className="text-xs text-muted-foreground">
                  {health.done} / {health.total} items resolved
                </span>
              </div>

              {/* Bar */}
              <div className="flex h-4 w-full rounded-full overflow-hidden gap-px bg-slate-100 dark:bg-slate-800">
                {HEALTH_SEGMENTS.map((seg) => {
                  const count = health[seg.key as keyof typeof health] as number
                  const pct = health.total > 0 ? (count / health.total) * 100 : 0
                  if (pct === 0) return null
                  return (
                    <div
                      key={seg.key}
                      className={cn("h-full transition-all duration-500", seg.color)}
                      style={{ width: `${pct}%` }}
                      title={`${seg.label}: ${count} (${Math.round(pct)}%)`}
                    />
                  )
                })}
              </div>

              {/* Labels */}
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {HEALTH_SEGMENTS.map((seg) => {
                  const count = health[seg.key as keyof typeof health] as number
                  const pct = health.total > 0 ? (count / health.total) * 100 : 0
                  if (count === 0) return null
                  return (
                    <div key={seg.key} className="flex items-center gap-1.5 text-xs">
                      <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", seg.color)} />
                      <span className={cn("font-medium", seg.text)}>{seg.label}</span>
                      <span className="text-muted-foreground">{count} ({Math.round(pct)}%)</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Mini-Gantt Roadmap ─────────────────────────────────────────── */}
          <MiniGantt items={ganttItems} onTaskClick={handleGanttTaskClick} />

          {/* ── Pie Charts row ─────────────────────────────────────────────── */}
          <div className="grid gap-5 md:grid-cols-2">

            {/* Task Status Pie */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-5 shadow-sm">
              <h3 className="text-sm font-semibold mb-4 text-slate-800 dark:text-slate-200">Task Distribution</h3>
              {analytics?.taskPie && analytics.taskPie.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={analytics.taskPie}
                      cx="50%" cy="50%"
                      innerRadius={PIE_RADIUS.inner}
                      outerRadius={PIE_RADIUS.outer}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) =>
                        percent >= PIE_LABEL_MIN_PCT ? `${name.replace("_", " ")}` : ""
                      }
                      labelLine={false}
                    >
                      {analytics.taskPie.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ReTooltip
                      formatter={(value: number, name: string) => [value, name.replace(/_/g, " ")]}
                      contentStyle={{ borderRadius: "8px", fontSize: 12, border: "1px solid #e2e8f0" }}
                    />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">No tasks yet</div>
              )}
            </div>

            {/* Milestone Status Pie */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-5 shadow-sm">
              <h3 className="text-sm font-semibold mb-4 text-slate-800 dark:text-slate-200">Milestone Status</h3>
              {analytics?.milestonePie && analytics.milestonePie.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={analytics.milestonePie}
                      cx="50%" cy="50%"
                      innerRadius={PIE_RADIUS.inner}
                      outerRadius={PIE_RADIUS.outer}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) =>
                        percent >= PIE_LABEL_MIN_PCT ? name.replace("_", " ") : ""
                      }
                      labelLine={false}
                    >
                      {analytics.milestonePie.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ReTooltip
                      formatter={(value: number, name: string) => [value, name.replace(/_/g, " ")]}
                      contentStyle={{ borderRadius: "8px", fontSize: 12, border: "1px solid #e2e8f0" }}
                    />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">No milestones yet</div>
              )}
            </div>
          </div>

          {/* ── Productivity Leaderboard ───────────────────────────────────── */}
          {analytics?.productivity && analytics.productivity.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-5 shadow-sm">
              <h3 className="text-sm font-semibold mb-1 text-slate-800 dark:text-slate-200">Productivity Points</h3>
              <p className="text-xs text-muted-foreground mb-4">Weighted score: +10 task done · +7 in review · +5 started · +1 log entry</p>
              <div className="space-y-2">
                <TooltipProvider delayDuration={200}>
                {(() => {
                    const maxPts = Math.max(...analytics.productivity.map((m: any) => m.points), 1)
                    return analytics.productivity.map((member: any, i: number) => {
                      const pct = (member.points / maxPts) * 100
                      const isAdmin = member.role === "ADMIN"
                      return (
                        <div key={member.userId} className="flex items-center gap-3">
                          <span className={cn(
                            "text-xs w-5 h-5 flex items-center justify-center rounded-full font-semibold",
                            isAdmin
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 ring-2 ring-emerald-500"
                              : "text-slate-500"
                          )}>
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-32 truncate flex items-center gap-1.5">
                            {member.userName}
                            {isAdmin && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p className="text-xs">Project Admin</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </span>
                          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                            <div
                              className={cn(
                                "h-2 rounded-full transition-all duration-500",
                                isAdmin ? "bg-emerald-500" : "bg-blue-500"
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={cn(
                            "text-xs font-semibold w-14 text-right",
                            isAdmin
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-blue-600 dark:text-blue-400"
                          )}>
                            {member.points} pts
                          </span>
                        </div>
                      )
                    })
                  })()}
                </TooltipProvider>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── OTHER TABS ──────────────────────────────────────────────────── */}
        <TabsContent value="board" className="flex-1 min-h-0 m-0">
          <KanbanBoard projectId={projectId} />
        </TabsContent>

        <TabsContent value="milestones" className="mt-0">
          <MilestoneList projectId={projectId} />
        </TabsContent>

        <TabsContent value="files" className="mt-0">
          <ProjectFiles projectId={projectId} />
        </TabsContent>

        <TabsContent value="logs" className="mt-0 pb-6">
          <ProgressLog projectId={projectId} />
        </TabsContent>
      </Tabs>

      {/* Task Detail Sheet — opened from Gantt task click */}
      {sheetTask && (
        <TaskDetailSheet
          task={sheetTask}
          open={sheetOpen}
          onOpenChange={(open) => { if (!open) { setSheetOpen(false); setSheetTask(null) } }}
          onDeleted={() => { setSheetOpen(false); setSheetTask(null) }}
        />
      )}
    </div>
  )
}
