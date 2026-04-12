import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
  className?: string
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col items-start justify-between gap-4 md:flex-row md:items-center pb-6 border-b border-slate-200 dark:border-slate-800 mb-6", className)}>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{title}</h1>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex w-full items-center gap-2 md:w-auto">
          {children}
        </div>
      )}
    </div>
  )
}
