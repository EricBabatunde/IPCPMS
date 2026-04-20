"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { Clock, Check, Loader2, Calendar, Plus } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CreateMilestoneModal } from "./CreateMilestoneModal"

export function MilestoneList({ projectId }: { projectId: string }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data: milestones, isLoading } = useQuery({
    queryKey: ["projects", projectId, "milestones"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/milestones`)
      if (!res.ok) throw new Error("Failed to fetch milestones")
      return res.json()
    },
  })

  // Management State
  const queryClient = useQueryClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null)
  const [isManageOpen, setIsManageOpen] = useState(false)
  
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editDueDate, setEditDueDate] = useState("")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openManage = (milestone: any) => {
    setSelectedMilestone(milestone)
    setEditTitle(milestone.title)
    setEditDescription(milestone.description || "")
    setEditDueDate(new Date(milestone.dueDate).toISOString().split('T')[0])
    setIsManageOpen(true)
  }

  const invalidateCache = () => {
    queryClient.invalidateQueries({ queryKey: ["projects", projectId, "milestones"] })
    setIsManageOpen(false)
  }

  const updateMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const res = await fetch(`/api/milestones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error("Failed to update milestone")
      return res.json()
    },
    onSettled: invalidateCache
  })

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/milestones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACHIEVED" })
      })
      if (!res.ok) throw new Error("Failed to complete milestone")
      return res.json()
    },
    onSettled: invalidateCache
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/milestones/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete milestone")
      return res.json()
    },
    onSettled: invalidateCache
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const total = milestones?.length || 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completed = milestones?.filter((m: any) => m.status === "ACHIEVED").length || 0
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 flex-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Milestone Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progress}%</div>
              <p className="text-xs text-muted-foreground">
                {completed} of {total} milestones achieved
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="ml-4">
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Milestone
          </Button>
        </div>
      </div>

      <CreateMilestoneModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        projectId={projectId}
      />

      <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-8 py-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {milestones?.map((milestone: any) => {
          const isAchieved = milestone.status === "ACHIEVED"
          const isOverdue = !isAchieved && new Date(milestone.dueDate) < new Date()
          
          return (
            <div key={milestone.id} className="relative">
              <span className={`absolute -left-[35px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-950 ${isAchieved ? "bg-primary text-primary-foreground" : isOverdue ? "bg-red-500 text-white" : "bg-slate-200 dark:bg-slate-800"}`}>
                {isAchieved ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500" />
                )}
              </span>
              
              <Card 
                className="max-w-2xl border-slate-200 shadow-sm dark:border-slate-800 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => openManage(milestone)}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{milestone.title}</h3>
                    <Badge variant={isAchieved ? "default" : isOverdue ? "destructive" : "secondary"}>
                      {isAchieved ? "Achieved" : isOverdue ? "Overdue" : "Pending"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                    {milestone.description || "No description provided."}
                  </p>
                  <div className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                    <Calendar className="mr-2 h-4 w-4" />
                    Target: {format(new Date(milestone.dueDate), "MMMM d, yyyy")}
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}

        {milestones?.length === 0 && (
          <div className="text-slate-500 italic">No milestones defined yet. Click &quot;Add Milestone&quot; to get started.</div>
        )}
      </div>

      {selectedMilestone && (
        <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Milestone</DialogTitle>
              <CardDescription>Update details or mark this milestone as achieved.</CardDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
              </div>
            </div>
            <DialogFooter className="flex w-full justify-between sm:justify-between items-center">
              <Button 
                variant="destructive" 
                onClick={() => deleteMutation.mutate(selectedMilestone.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => updateMutation.mutate({ 
                    id: selectedMilestone.id, 
                    data: { title: editTitle, description: editDescription, dueDate: new Date(editDueDate).toISOString() }
                  })}
                  disabled={updateMutation.isPending}
                >
                  Save
                </Button>
                {selectedMilestone.status !== "ACHIEVED" && (
                  <Button 
                    onClick={() => completeMutation.mutate(selectedMilestone.id)}
                    disabled={completeMutation.isPending}
                  >
                    Mark Achieved
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
