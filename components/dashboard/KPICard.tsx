import { LucideIcon } from "lucide-react"

interface KPICardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: "blue" | "green" | "red" | "yellow" | "default"
  trend?: string
}

export function KPICard({ title, value, icon: Icon, color = "default", trend }: KPICardProps) {
  const colorStyles = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
    green: "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400",
    yellow: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400",
    default: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <div className={`p-2 rounded-lg ${colorStyles[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {value}
        </h2>
        {trend && (
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}
