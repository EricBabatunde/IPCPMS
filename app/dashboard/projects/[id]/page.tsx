/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { LayoutDashboard, ListTodo, Map, FolderOpen, Loader2, GraduationCap } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/shared/PageHeader"
import { KanbanBoard } from "@/components/projects/KanbanBoard"
import { MilestoneList } from "@/components/projects/MilestoneList"
import { ProjectFiles } from "@/components/projects/ProjectFiles"
import { Badge } from "@/components/ui/badge"

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string

  const { data: project, isLoading } = useQuery({
    queryKey: ["projects", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) throw new Error("Failed to fetch project")
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-2xl font-bold">Project Not Found</h2>
        <p className="text-slate-500">The project you are looking for does not exist or you don&apos;t have access.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader 
        title={project.name} 
        description={project.description || "No description provided."}
      >
        <Badge variant={project.status === "COMPLETED" ? "default" : "secondary"} className="uppercase">
          {project.status.replace("_", " ")}
        </Badge>
        {project.courseCode && project.courseCode !== "none" && (
          <Badge variant="outline" className="gap-1.5 border-primary/30 text-primary bg-primary/5">
            <GraduationCap className="h-3.5 w-3.5" />
            {project.courseCode}
          </Badge>
        )}
      </PageHeader>

      <Tabs defaultValue="board" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mb-4 inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-auto mr-auto">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="board" className="gap-2">
            <ListTodo className="h-4 w-4" /> Kanban Board
          </TabsTrigger>
          <TabsTrigger value="milestones" className="gap-2">
            <Map className="h-4 w-4" /> Milestones
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-2">
            <FolderOpen className="h-4 w-4" /> Files
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-0">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Project Details</h3>
              <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
                {/* Details like dates, team size, etc can go here */}
                <p>Team Members: {project.members?.length || 0}</p>
                <div className="mt-4 flex -space-x-2">
                    {project.members?.map((member: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                      <div key={member.id} className="h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-950 bg-slate-200 overflow-hidden" title={member.user.name}>
                        {member.user.image ? (
                          <img src={member.user.image} alt={member.user.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-primary text-xs text-white font-medium">
                            {member.user.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="board" className="flex-1 min-h-0 m-0">
          <KanbanBoard projectId={projectId} />
        </TabsContent>

        <TabsContent value="milestones" className="mt-0">
          <MilestoneList projectId={projectId} />
        </TabsContent>

        <TabsContent value="files" className="mt-0">
          <ProjectFiles projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
