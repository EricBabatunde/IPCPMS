/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Plus, FolderKanban, MoreVertical, Calendar, Archive, Trash2, Edit, UserPlus, Loader2, GraduationCap
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { toast } from "sonner"

export default function ProjectsPage() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json()
    },
  })

  const myProjects = useMemo(
    () => projects?.filter((p: any) => p.isMember) || [],
    [projects]
  )
  const otherProjects = useMemo(
    () => projects?.filter((p: any) => !p.isMember) || [],
    [projects]
  )

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ON_HOLD" }),
      })
      if (!res.ok) throw new Error("Failed to archive project")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Project archived")
    },
    onError: () => toast.error("Failed to archive project"),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete project")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Project deleted")
      setDeleteTarget(null)
    },
    onError: () => toast.error("Failed to delete project"),
  })

  const joinMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}/join`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to join project")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast.success("You have joined the project!")
    },
    onError: () => toast.error("Failed to join project"),
  })

  const renderProjectCard = (project: any, isMember: boolean) => {
    const progress = project.completionPercentage || 0

    return (
      <Card key={project.id} className="group overflow-hidden transition-all hover:shadow-md border-slate-200 dark:border-slate-800 hover:border-primary/50">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between">
            <Link href={isMember ? `/dashboard/projects/${project.id}` : "#"}>
              <h3 className="font-semibold text-lg line-clamp-1 hover:text-primary transition-colors">
                {project.name}
              </h3>
            </Link>
            {isMember ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/projects/${project.id}`} className="flex items-center gap-2">
                      <Edit className="h-4 w-4" /> View / Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => archiveMutation.mutate(project.id)}
                    className="flex items-center gap-2"
                  >
                    <Archive className="h-4 w-4" /> Archive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteTarget(project.id)}
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => joinMutation.mutate(project.id)}
                disabled={joinMutation.isPending}
                className="gap-1.5"
              >
                {joinMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                Join
              </Button>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
            {project.description || "No description provided."}
          </p>
        </CardHeader>
        {isMember && (
          <CardContent className="p-4 py-2">
            <div className="flex justify-between items-center text-sm font-medium mb-2">
              <span className="text-slate-700 dark:text-slate-300">Progress</span>
              <span className="text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        )}
        <CardFooter className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-2 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(new Date(project.startDate), "MMM d, yyyy")}</span>
            </div>
            {project.courseCode && project.courseCode !== "none" && (
              <Badge variant="outline" className="h-5 gap-1 px-1.5 text-[10px] font-semibold border-primary/30 text-primary bg-primary/5">
                <GraduationCap className="h-3 w-3" />
                {project.courseCode}
              </Badge>
            )}
          </div>
          <div className="flex -space-x-2">
            {project.members?.slice(0, 3).map((member: any) => (
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
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage your team&apos;s projects and track overall progress."
      >
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </PageHeader>

      <CreateProjectDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Project"
        description="This will permanently delete this project and all associated tasks, milestones, and files. This action cannot be undone."
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
      />

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
        <Tabs defaultValue="my-projects" className="space-y-4">
          <TabsList>
            <TabsTrigger value="my-projects">My Projects ({myProjects.length})</TabsTrigger>
            <TabsTrigger value="explore">Explore Other Projects ({otherProjects.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="my-projects">
            {myProjects.length === 0 ? (
              <EmptyState
                icon={<FolderKanban className="h-10 w-10" />}
                title="No projects yet"
                description="Create a new project or join an existing one from the Explore tab."
                action={
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Create Project
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {myProjects.map((project: any) => renderProjectCard(project, true))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="explore">
            {otherProjects.length === 0 ? (
              <EmptyState
                icon={<FolderKanban className="h-10 w-10" />}
                title="You&apos;re part of everything!"
                description="There are no other projects to explore."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {otherProjects.map((project: any) => renderProjectCard(project, false))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
