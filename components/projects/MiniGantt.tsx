"use client"

import { useState, useRef, useMemo } from "react"
import {
  addDays, subDays, differenceInDays, format, startOfDay, isToday,
} from "date-fns"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GanttItem {
  id: string
  title: string
  type: "task" | "milestone"
  status: string
  dueDate: string
  isOverdue: boolean
}

interface MiniGanttProps {
  items: GanttItem[]
  onTaskClick?: (taskId: string) => void
}

// ─── Config ───────────────────────────────────────────────────────────────────

type Scale = "week" | "month"

const SCALE_CONFIG = {
  week:  { days: 28, colWidthPx: 44, label: "4-Week View" },
  month: { days: 90, colWidthPx: 16, label: "3-Month View" },
}

const LABEL_WIDTH = 200   // px — left Y-axis
const ROW_HEIGHT  = 44    // px per item row

// ── Status colours ─────────────────────────────────────────────────────────────

function getStatusColor(type: "task" | "milestone", status: string, isOverdue: boolean) {
  if (isOverdue) return { bg: "bg-rose-500", ring: "ring-rose-400", text: "text-rose-600" }
  if (type === "milestone") {
    return status === "ACHIEVED"
      ? { bg: "bg-emerald-500", ring: "ring-emerald-400", text: "text-emerald-600" }
      : { bg: "bg-amber-400",   ring: "ring-amber-400",   text: "text-amber-600" }
  }
  const map: Record<string, { bg: string; ring: string; text: string }> = {
    DONE:        { bg: "bg-emerald-500", ring: "ring-emerald-400", text: "text-emerald-600" },
    IN_PROGRESS: { bg: "bg-blue-500",    ring: "ring-blue-400",    text: "text-blue-600" },
    IN_REVIEW:   { bg: "bg-violet-500",  ring: "ring-violet-400",  text: "text-violet-600" },
    TODO:        { bg: "bg-slate-400",   ring: "ring-slate-300",   text: "text-slate-500" },
  }
  return map[status] ?? map.TODO
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MiniGantt({ items, onTaskClick }: MiniGanttProps) {
  const [scale, setScale] = useState<Scale>("week")
  const scrollRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{ item: GanttItem; x: number; y: number } | null>(null)

  const { days, colWidthPx } = SCALE_CONFIG[scale]
  const today = startOfDay(new Date())

  // Anchor: start the timeline a few days before the earliest item dueDate
  const ganttStart = useMemo(() => {
    if (items.length === 0) return subDays(today, 7)
    const earliest = items.reduce((min, it) =>
      new Date(it.dueDate) < new Date(min.dueDate) ? it : min
    )
    return subDays(startOfDay(new Date(earliest.dueDate)), 7)
  }, [items, today])

  // X-axis ticks (one per day in week view, one per week in month view)
  const ticks = useMemo(() => {
    const result: Date[] = []
    const step = scale === "week" ? 1 : 7
    for (let d = 0; d <= days; d += step) {
      result.push(addDays(ganttStart, d))
    }
    return result
  }, [ganttStart, days, scale])

  // Today's offset in pixels
  const todayOffset = differenceInDays(today, ganttStart) * colWidthPx

  // ── Pixel offset for a date ────────────────────────────────────────────────
  function dateToX(date: Date): number {
    return differenceInDays(startOfDay(date), ganttStart) * colWidthPx
  }

  const timelineWidth = days * colWidthPx

  // ── Scroll helpers ─────────────────────────────────────────────────────────
  function scroll(dir: -1 | 1) {
    scrollRef.current?.scrollBy({ left: dir * colWidthPx * 7, behavior: "smooth" })
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 gap-2">
        <CalendarDays className="h-6 w-6" />
        <span className="text-sm">No items with due dates to display</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Roadmap</h3>
          <span className="text-xs text-muted-foreground">
            ({items.length} item{items.length !== 1 ? "s" : ""})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Scale toggle */}
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
            {(["week", "month"] as Scale[]).map((s) => (
              <button
                key={s}
                onClick={() => setScale(s)}
                className={cn(
                  "px-3 py-1.5 font-medium transition-colors",
                  scale === s
                    ? "bg-primary text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                {s === "week" ? "4W" : "3M"}
              </button>
            ))}
          </div>
          {/* Scroll controls */}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => scroll(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => scroll(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-100 dark:border-slate-800 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-blue-500 inline-block" />Task</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rotate-45 bg-amber-400 inline-block" />Milestone</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-rose-500 animate-pulse inline-block" />Overdue</span>
        <span className="flex items-center gap-1.5 ml-auto">
          <span className="border-l-2 border-dashed border-slate-400 h-3 inline-block" />
          Today
        </span>
      </div>

      {/* ── Main grid ────────────────────────────────────────────────────── */}
      <div className="flex overflow-hidden">
        {/* Y-axis — fixed item labels */}
        <div
          className="flex-shrink-0 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950"
          style={{ width: LABEL_WIDTH }}
        >
          {/* Header cell to align with X-axis row */}
          <div
            className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
            style={{ height: 32 }}
          />
          {items.map((item) => {
            const colors = getStatusColor(item.type, item.status, item.isOverdue)
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-2 px-3 border-b border-slate-50 dark:border-slate-800/50 text-sm",
                  item.type === "task" && onTaskClick
                    ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    : ""
                )}
                style={{ height: ROW_HEIGHT }}
                onClick={() => item.type === "task" && onTaskClick?.(item.id)}
              >
                {/* Type indicator */}
                {item.type === "milestone" ? (
                  <span className={cn("h-2.5 w-2.5 rotate-45 flex-shrink-0", colors.bg)} />
                ) : (
                  <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", colors.bg)} />
                )}
                <span className="truncate text-slate-700 dark:text-slate-300 font-medium text-xs">
                  {item.title}
                </span>
              </div>
            )
          })}
        </div>

        {/* Scrollable timeline */}
        <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-hidden relative">
          <div style={{ width: timelineWidth, minWidth: "100%" }}>
            {/* X-axis ticks */}
            <div
              className="flex items-end border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 select-none relative"
              style={{ height: 32 }}
            >
              {ticks.map((tick) => {
                const x = dateToX(tick)
                const isTodayTick = isToday(tick)
                return (
                  <div
                    key={tick.toISOString()}
                    className={cn(
                      "absolute bottom-1 text-[10px] px-0.5 whitespace-nowrap",
                      isTodayTick
                        ? "text-primary font-bold"
                        : "text-slate-400 dark:text-slate-500"
                    )}
                    style={{ left: x }}
                  >
                    {scale === "week"
                      ? format(tick, "d")
                      : format(tick, "MMM d")}
                  </div>
                )
              })}
            </div>

            {/* Rows */}
            <div className="relative">
              {/* Vertical grid lines */}
              {ticks.map((tick) => (
                <div
                  key={tick.toISOString()}
                  className="absolute top-0 bottom-0 border-l border-slate-100 dark:border-slate-800"
                  style={{ left: dateToX(tick) }}
                />
              ))}

              {/* Today line */}
              {todayOffset >= 0 && todayOffset <= timelineWidth && (
                <div
                  className="absolute top-0 bottom-0 border-l-2 border-dashed border-slate-400 dark:border-slate-500 z-10 pointer-events-none"
                  style={{ left: todayOffset }}
                >
                  <span className="absolute -top-0 left-1 text-[9px] font-semibold text-slate-500 bg-white dark:bg-slate-950 px-0.5">
                    Today
                  </span>
                </div>
              )}

              {/* Item rows */}
              {items.map((item) => {
                const x = dateToX(new Date(item.dueDate))
                const colors = getStatusColor(item.type, item.status, item.isOverdue)
                const isClickable = item.type === "task" && !!onTaskClick

                return (
                  <div
                    key={item.id}
                    className="relative border-b border-slate-50 dark:border-slate-800/50"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Marker */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                      style={{ left: Math.max(8, Math.min(x, timelineWidth - 8)) }}
                    >
                      {item.type === "milestone" ? (
                        // Diamond
                        <div
                          className={cn(
                            "h-4 w-4 rotate-45 border-2 border-white dark:border-slate-950 shadow-sm transition-all",
                            colors.bg,
                            item.isOverdue && "animate-pulse ring-2",
                            item.isOverdue && colors.ring,
                            isClickable && "cursor-pointer hover:scale-125"
                          )}
                          title={item.title}
                          onMouseEnter={(e) => setTooltip({ item, x: e.clientX, y: e.clientY })}
                          onMouseLeave={() => setTooltip(null)}
                        />
                      ) : (
                        // Circle
                        <div
                          className={cn(
                            "h-4 w-4 rounded-full border-2 border-white dark:border-slate-950 shadow-sm transition-all",
                            colors.bg,
                            item.isOverdue && "animate-pulse ring-2",
                            item.isOverdue && colors.ring,
                            isClickable && "cursor-pointer hover:scale-125"
                          )}
                          title={item.title}
                          onClick={() => isClickable && onTaskClick?.(item.id)}
                          onMouseEnter={(e) => {
                            if (!isClickable) setTooltip({ item, x: e.clientX, y: e.clientY })
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        />
                      )}
                    </div>

                    {/* Due date label — only in 4-week view */}
                    {scale === "week" && (
                      <div
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 ml-3 text-[10px] whitespace-nowrap pointer-events-none",
                          colors.text
                        )}
                        style={{ left: Math.max(8, Math.min(x, timelineWidth - 80)) + 12 }}
                      >
                        {format(new Date(item.dueDate), "MMM d")}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating Tooltip (milestone hover or non-clickable task) ──────── */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg px-3 py-2 text-sm max-w-xs"
          style={{ top: tooltip.y + 12, left: tooltip.x + 8 }}
        >
          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{tooltip.item.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
            {tooltip.item.type} · {tooltip.item.status.replace(/_/g, " ").toLowerCase()}
          </p>
          <p className="text-xs text-muted-foreground">
            Due: {format(new Date(tooltip.item.dueDate), "MMMM d, yyyy")}
          </p>
          {tooltip.item.isOverdue && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-0.5">⚠ Overdue</p>
          )}
        </div>
      )}
    </div>
  )
}
