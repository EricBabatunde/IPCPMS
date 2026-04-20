"use client"

import { useQuery } from "@tanstack/react-query"
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import { ChartSkeleton } from "./ChartSkeleton"

// Colour gradient: low points → slate, high points → emerald
const POINT_COLORS = ["#10b981", "#059669", "#34d399", "#6ee7b7", "#a7f3d0",
                      "#d1fae5", "#94a3b8", "#64748b", "#475569", "#334155"]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 shadow-md text-sm">
      <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{d.userName}</p>
      <p className="text-emerald-600 dark:text-emerald-400 font-medium">{d.points} pts total</p>
      <p className="text-xs text-muted-foreground mt-1">+10 task done · +5 started · +1 log entry</p>
    </div>
  )
}

export function MemberContributionBarChart({ projectId }: { projectId?: string | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", "contributions", projectId],
    queryFn: async () => {
      const url = `/api/analytics?type=contributions${projectId ? `&projectId=${projectId}` : ""}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch contribution data")
      return res.json()
    },
  })

  if (isLoading) return <ChartSkeleton className="h-[350px] w-full" />
  if (!data || data.length === 0) {
    return <div className="h-[350px] flex items-center justify-center text-slate-400">No member contributions found</div>
  }

  return (
    <div className="flex flex-col h-[400px] w-full p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <h3 className="text-lg font-semibold mb-1 px-2">Productivity Leaderboard</h3>
      <p className="text-xs text-muted-foreground mb-4 px-2">Weighted score: +10 finished · +5 started · +1 log entry</p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            barSize={18}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} vertical={true} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 12, fill: "#64748b" }}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <YAxis
              type="category"
              dataKey="userName"
              width={110}
              tick={{ fontSize: 12, fill: "#334155", fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
            <Bar dataKey="points" name="Productivity Points" radius={[0, 6, 6, 0]}>
              {data.map((_: unknown, index: number) => (
                <Cell key={`cell-${index}`} fill={POINT_COLORS[index % POINT_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
