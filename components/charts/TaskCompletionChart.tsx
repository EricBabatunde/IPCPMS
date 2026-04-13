"use client"

import { useQuery } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { 
  ComposedChart, Area, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts"
import { ChartSkeleton } from "./ChartSkeleton"

export function TaskCompletionChart({ projectId }: { projectId?: string | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", "task-completion", projectId],
    queryFn: async () => {
      const url = `/api/analytics?type=task-completion${projectId ? `&projectId=${projectId}` : ""}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch task completion status")
      return res.json()
    }
  })

  if (isLoading) return <ChartSkeleton className="h-[350px] w-full" />
  if (!data || data.length === 0) return <div className="h-[350px] flex items-center justify-center text-slate-400">No data available</div>

  return (
    <div className="flex flex-col h-[400px] w-full p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 px-2">Task Activity (14 Days)</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dbeafe" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#dbeafe" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="date" 
              tickFormatter={(val) => format(parseISO(val), "MMM d")} 
              tick={{ fontSize: 12, fill: "#64748b" }}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
              dy={10}
            />
            <YAxis 
              allowDecimals={false}
              tick={{ fontSize: 12, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelFormatter={(val) => format(parseISO(val as string), "MMMM d, yyyy")}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
            <Area 
              type="monotone" 
              dataKey="created" 
              name="Tasks Created" 
              fillOpacity={1} 
              fill="url(#colorCreated)" 
              stroke="#2563eb" 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="completed" 
              name="Tasks Completed" 
              stroke="#059669" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: "#059669", stroke: "#fff", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
