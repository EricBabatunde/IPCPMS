"use client"

import { useQuery } from "@tanstack/react-query"
import { FolderKanban, CheckSquare, CheckCircle, AlertCircle } from "lucide-react"

import { KPICard } from "@/components/dashboard/KPICard"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"

// Analytics Components
import { TaskCompletionChart } from "@/components/charts/TaskCompletionChart"
import { ProjectStatusPieChart } from "@/components/charts/ProjectStatusPieChart"
import { BurndownChart } from "@/components/charts/BurndownChart"
import { MilestoneProgressChart } from "@/components/charts/MilestoneProgressChart"
import { TeamActivityHeatmap } from "@/components/charts/TeamActivityHeatmap"
import { MemberContributionBarChart } from "@/components/charts/MemberContributionBarChart"

export default function DashboardPage() {
  const { data: kpis, isLoading: isLoadingKPIs } = useQuery({
    queryKey: ["analytics", "kpis"],
    queryFn: async () => {
      const res = await fetch("/api/analytics?type=kpis")
      if (!res.ok) throw new Error("Failed to fetch KPIs")
      return res.json()
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Global overview of your projects, tasks, and team activities.
        </p>
      </div>

      {/* Row 1: KPIs */}
      {isLoadingKPIs ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Projects" value={kpis?.totalProjects || 0} icon={FolderKanban} color="blue" />
          <KPICard title="Total Tasks" value={kpis?.totalTasks || 0} icon={CheckSquare} color="default" />
          <KPICard title="Completed Tasks" value={kpis?.completedTasks || 0} icon={CheckCircle} color="green" />
          <KPICard title="Overdue Tasks" value={kpis?.overdueTasks || 0} icon={AlertCircle} color="red" />
        </div>
      )}

      {/* Row 2: Task Completion (2/3) + Project Status Donut (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TaskCompletionChart />
        </div>
        <div>
          <ProjectStatusPieChart />
        </div>
      </div>

      {/* Row 3: Burndown (1/2) + Milestone Radial (1/2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <BurndownChart />
        </div>
        <div>
          <MilestoneProgressChart />
        </div>
      </div>

      {/* Row 4: Heatmap (full width) */}
      <div className="w-full">
        <TeamActivityHeatmap />
      </div>

      {/* Row 5: Contribution (2/3) + Activity Feed (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
        <div className="lg:col-span-2">
          <MemberContributionBarChart />
        </div>
        <div className="h-full">
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
