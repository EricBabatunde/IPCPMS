"use client"

import { useQuery } from "@tanstack/react-query"
import { ChartSkeleton } from "./ChartSkeleton"

function getHeatColor(count: number, max: number): string {
  if (count === 0) return "#f1f5f9"
  // Calculate relative intensity between 200 and 800 for tailwind blue equivalent
  // #1d4ed8 is relative to roughly tailwind blue-700
  // L range: 95% (lightest) to 40% (darkest blue)
  
  const intensity = Math.max(0.1, count / max)
  const lightness = 95 - (intensity * 55) // 95 to 40
  
  // HSL for tailwind blue hue is around 220, saturation around 90%
  return `hsl(217, 90%, ${lightness}%)`
}

export function TeamActivityHeatmap({ projectId }: { projectId?: string | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", "heatmap", projectId],
    queryFn: async () => {
      const url = `/api/analytics?type=heatmap${projectId ? `&projectId=${projectId}` : ""}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch heatmap data")
      return res.json()
    }
  })

  if (isLoading) return <ChartSkeleton className="h-[400px] w-full" />
  if (!data || data.length === 0) {
    return <div className="h-[400px] flex items-center justify-center text-slate-400">No team activity tracked</div>
  }

  // Pre-process data into layout rows
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMap = new Map<string, any>()
  let maxCount = 1

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data.forEach((cell: any) => {
    if (!userMap.has(cell.userName)) {
      userMap.set(cell.userName, { userName: cell.userName, counts: {} })
    }
    userMap.get(cell.userName).counts[cell.day] = cell.activityCount
    if (cell.activityCount > maxCount) maxCount = cell.activityCount
  })

  const rows = Array.from(userMap.values())

  return (
    <div className="flex flex-col w-full p-6 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
      <h3 className="text-lg font-semibold mb-6">Team Activity Heatmap (Last 7 Days)</h3>
      
      <div className="min-w-[600px]">
        {/* X Axis Header */}
        <div className="flex mb-2">
          <div className="w-32 flex-shrink-0" /> {/* Label spacer */}
          <div className="flex-1 flex justify-between px-2">
            {days.map(day => (
              <div key={day} className="flex-1 text-center text-xs text-slate-500 font-medium">
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {rows.map(row => (
            <div key={row.userName} className="flex items-center group">
              {/* Y Axis Label */}
              <div className="w-32 flex-shrink-0 text-sm font-medium text-slate-700 dark:text-slate-300 truncate pr-4 text-right">
                {row.userName}
              </div>
              
              {/* Cells */}
              <div className="flex-1 flex justify-between gap-1 px-2">
                {days.map(day => {
                  const count = row.counts[day] || 0
                  const color = getHeatColor(count, maxCount)
                  return (
                    <div 
                      key={`${row.userName}-${day}`}
                      className="flex-1 aspect-square rounded-md transition-all duration-200 hover:ring-2 ring-primary/50 relative"
                      style={{ backgroundColor: color }}
                      title={`${row.userName} — ${count} activities on ${day}`}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 flex items-center justify-end gap-2 text-xs text-slate-500">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: getHeatColor(0, maxCount) }} />
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: getHeatColor(maxCount * 0.25, maxCount) }} />
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: getHeatColor(maxCount * 0.5, maxCount) }} />
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: getHeatColor(maxCount * 0.75, maxCount) }} />
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: getHeatColor(maxCount, maxCount) }} />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
