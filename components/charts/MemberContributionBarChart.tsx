"use client"

import { useQuery } from "@tanstack/react-query"
import { 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts"
import { ChartSkeleton } from "./ChartSkeleton"

export function MemberContributionBarChart({ projectId }: { projectId?: string | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", "contributions", projectId],
    queryFn: async () => {
      const url = `/api/analytics?type=contributions${projectId ? `&projectId=${projectId}` : ""}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch contribution data")
      return res.json()
    }
  })

  if (isLoading) return <ChartSkeleton className="h-[350px] w-full" />
  if (!data || data.length === 0) return <div className="h-[350px] flex items-center justify-center text-slate-400">No member contributions found</div>

  return (
    <div className="flex flex-col h-[400px] w-full p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 px-2">Member Contributions (Top 10)</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            layout="vertical" 
            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            barSize={20}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
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
              width={100}
              tick={{ fontSize: 12, fill: "#334155", fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
            
            <Bar dataKey="tasksCompleted" name="Tasks" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
            <Bar dataKey="commentsPosted" name="Comments" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="filesUploaded" name="Files" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="messagesSent" name="Messages" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
