"use client"

import { useQuery } from "@tanstack/react-query"
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, Tooltip } from "recharts"
import { ChartSkeleton } from "./ChartSkeleton"

export function MilestoneProgressChart({ projectId }: { projectId?: string | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", "milestones", projectId],
    queryFn: async () => {
      const url = `/api/analytics?type=milestones${projectId ? `&projectId=${projectId}` : ""}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch milesones")
      return res.json()
    }
  })

  if (isLoading) return <ChartSkeleton className="h-[350px] w-full" />
  if (!data || !data.milestones || data.milestones.length === 0) {
    return <div className="h-[350px] flex items-center justify-center text-slate-400">No milestones tracked</div>
  }

  // To make RadialBarChart render them inside each other, we pass the array directly.
  return (
    <div className="flex flex-col h-[400px] w-full p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
      <h3 className="text-lg font-semibold mb-2 px-2">Milestone Status</h3>
      
      {/* Center Label manually overlaid since Recharts foreignObject center text scaling can be rigid */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
        <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{data.percentComplete}%</span>
        <span className="text-xs text-slate-500 uppercase font-semibold tracking-wide">Achieved</span>
      </div>

      <div className="flex-1 min-h-0 relative z-10 w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            cx="50%" 
            cy="50%" 
            innerRadius="50%" 
            outerRadius="100%" 
            barSize={16} 
            data={data.milestones}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar
              background={{ fill: '#f1f5f9' }}
              dataKey="value"
              cornerRadius={10}
            />
            <Tooltip 
              cursor={false}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value, name) => [value, name]}
            />
            <Legend 
              iconSize={10} 
              iconType="circle" 
              layout="horizontal" 
              verticalAlign="bottom" 
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} 
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
