"use client"

import { useQuery } from "@tanstack/react-query"
import { PieChart, Pie, Legend, ResponsiveContainer, Tooltip, Cell } from "recharts"
import { ChartSkeleton } from "./ChartSkeleton"

const RADIAN = Math.PI / 180
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent === 0) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 1.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text 
      x={x} 
      y={y} 
      fill="#64748b" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
      fontWeight={500}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function ProjectStatusPieChart({ projectId }: { projectId?: string | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", "project-status", projectId],
    queryFn: async () => {
      const url = `/api/analytics?type=project-status${projectId ? `&projectId=${projectId}` : ""}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch project status")
      return res.json()
    }
  })

  if (isLoading) return <ChartSkeleton className="h-[350px] w-full" />
  if (!data || data.length === 0) return <div className="h-[350px] flex items-center justify-center text-slate-400">No project data available</div>

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const total = data.reduce((acc: number, curr: any) => acc + curr.value, 0)

  return (
    <div className="flex flex-col h-[400px] w-full p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
      <h3 className="text-lg font-semibold mb-2 px-2">Project Definitions</h3>
      
      {/* Center Label manually overlaid since Recharts custom center logic is rigid */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
        <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{total}</span>
        <span className="text-xs text-slate-500 uppercase font-semibold tracking-wide">Total</span>
      </div>

      <div className="flex-1 min-h-0 relative z-10 w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
              label={renderCustomizedLabel}
              labelLine={false}
              stroke="none"
            >
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend 
              iconType="circle" 
              layout="horizontal" 
              verticalAlign="bottom" 
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} 
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
