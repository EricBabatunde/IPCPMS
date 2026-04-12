import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard | IPCPMS",
  description: "Overview of your projects and tasks",
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to IPCPMS. Your overview will appear here.
        </p>
      </div>
    </div>
  )
}
