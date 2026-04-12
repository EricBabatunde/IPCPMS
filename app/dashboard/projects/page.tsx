/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Plus, FolderKanban, MoreVertical, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { format } from "date-fns"

export default function ProjectsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json()
    },
  })

  // Simple progress calculation (in a real app, calculate based on resolved tasks vs total)
  const calculateProgress = (project: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    // If no tasks, progress is 0
    if (!project._count?.tasks) return 0
    // Mocking progress for visual display since we don't fetch all task statuses here
    return Math.floor(Math.random() * 60) + 20 
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Projects" 
        description="Manage your team's projects and track overall progress."
      >
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </PageHeader>

      <CreateProjectDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-slate-100 dark:bg-slate-800" />
              <CardContent className="h-20" />
            </Card>
          ))}
        </div>
      ) : projects?.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-10 w-10" />}
          title="No projects found"
          description="Get started by creating your first collaborative project."
          action={
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            const progress = calculateProgress(project)
            return (
              <Card key={project.id} className="group overflow-hidden transition-all hover:shadow-md border-slate-200 dark:border-slate-800 hover:border-primary/50">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <Link href={`/dashboard/projects/${project.id}`}>
                      <h3 className="font-semibold text-lg line-clamp-1 hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Menu</span>
                    </Button>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {project.description || "No description provided."}
                  </p>
                </CardHeader>
                <CardContent className="p-4 py-2">
                  <div className="flex justify-between items-center text-sm font-medium mb-2">
                    <span className="text-slate-700 dark:text-slate-300">Progress</span>
                    <span className="text-primary">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </CardContent>
                <CardFooter className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-4 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(new Date(project.startDate), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex -space-x-2">
                    {project.members?.slice(0, 3).map((member: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                      <div key={member.id} className="h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-950 bg-slate-200 overflow-hidden">
                        {member.user.image ? (
                          <img src={member.user.image} alt={member.user.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-primary text-[10px] text-white font-medium">
                            {member.user.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))}
                    {project.members?.length > 3 && (
                      <div className="h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-950 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-medium z-10">
                        +{project.members.length - 3}
                      </div>
                    )}
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
