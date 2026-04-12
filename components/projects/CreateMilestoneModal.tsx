"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createMilestoneSchema, CreateMilestoneInput } from "@/lib/validations/milestone"
import { toast } from "sonner"

interface CreateMilestoneModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

export function CreateMilestoneModal({ open, onOpenChange, projectId }: CreateMilestoneModalProps) {
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateMilestoneInput>({
    resolver: zodResolver(createMilestoneSchema),
    defaultValues: {
      status: "UPCOMING",
      projectId,
    },
  })

  const dueDate = watch("dueDate")

  const createMutation = useMutation({
    mutationFn: async (data: CreateMilestoneInput) => {
      const response = await fetch(`/api/projects/${projectId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error("Failed to create milestone")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "milestones"] })
      toast.success("Milestone created", { description: "The milestone has been added to the timeline." })
      reset({ status: "UPCOMING", projectId })
      onOpenChange(false)
    },
    onError: () => {
      toast.error("Error", { description: "Failed to create the milestone." })
    },
    onSettled: () => setIsSubmitting(false),
  })

  const onSubmit = (data: CreateMilestoneInput) => {
    setIsSubmitting(true)
    createMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Milestone</DialogTitle>
          <DialogDescription>
            Add a new milestone to track project progress.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ms-title">Title <span className="text-red-500">*</span></Label>
            <Input id="ms-title" placeholder="E.g., Phase 1 Complete" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ms-desc">Description</Label>
            <Textarea
              id="ms-desc"
              placeholder="Describe milestone criteria..."
              className="resize-none h-20"
              {...register("description")}
            />
          </div>

          <div className="space-y-2 flex flex-col">
            <Label>Target Date <span className="text-red-500">*</span></Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full pl-3 text-left font-normal", !dueDate && "text-muted-foreground")}
                >
                  {dueDate ? format(new Date(dueDate), "PPP") : <span>Pick a date</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate ? new Date(dueDate) : undefined}
                  onSelect={(date) => setValue("dueDate", date?.toISOString() || "", { shouldValidate: true })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate.message}</p>}
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Milestone
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
