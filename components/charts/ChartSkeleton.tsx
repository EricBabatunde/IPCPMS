import { Loader2 } from "lucide-react"

export function ChartSkeleton({ className = "h-72" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 border-dashed animate-pulse ${className}`}>
      <Loader2 className="h-8 w-8 text-slate-300 dark:text-slate-700 animate-spin mb-4" />
      <p className="text-sm font-medium text-slate-400 dark:text-slate-600">Loading visualization...</p>
    </div>
  )
}
