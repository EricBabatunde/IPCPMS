"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import {
  Calendar as CalendarIcon,
  Loader2,
  X,
  Check,
  ChevronsUpDown,
  GraduationCap,
  Sparkles,
} from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createProjectSchema, CreateProjectInput } from "@/lib/validations/project"
import { COURSE_CODES, PROJECT_TYPES, getTasksForType } from "@/lib/project-templates"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  image: string | null
}

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<User[]>([])
  const [memberSearchOpen, setMemberSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Local state for the two new academic selectors (not connected to react-hook-form
  // because they are simple strings, not validated fields)
  const [courseCode, setCourseCode] = useState<string>("")
  const [projectType, setProjectType] = useState<string>("")

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users")
      if (!res.ok) throw new Error("Failed to fetch users")
      return res.json()
    },
    enabled: open,
  })

  const filteredUsers = users.filter(
    (u) =>
      !selectedMembers.some((m) => m.id === u.id) &&
      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const toggleMember = (user: User) => {
    if (selectedMembers.some((m) => m.id === user.id)) {
      setSelectedMembers((prev) => prev.filter((m) => m.id !== user.id))
    } else {
      setSelectedMembers((prev) => [...prev, user])
    }
  }

  const removeMember = (userId: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== userId))
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      status: "PLANNING",
    },
  })

  const startDate = watch("startDate")
  const endDate = watch("endDate")

  // How many tasks will be auto-seeded for the chosen type
  const seedCount = projectType ? getTasksForType(projectType).length : 0

  const createMutation = useMutation({
    mutationFn: async (data: CreateProjectInput) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          courseCode: courseCode || undefined,
          projectType: projectType || undefined,
          memberIds: selectedMembers.map((m) => m.id),
        }),
      })
      if (!response.ok) throw new Error("Failed to create project")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      const msg =
        seedCount > 0
          ? `Your new project has been created with ${seedCount} starter tasks in the Kanban board.`
          : "Your new project has been created successfully."
      toast.success("Project created", { description: msg })
      reset()
      setSelectedMembers([])
      setCourseCode("")
      setProjectType("")
      onOpenChange(false)
    },
    onError: () => {
      toast.error("Error", { description: "Failed to create the project. Please try again." })
    },
    onSettled: () => setIsSubmitting(false),
  })

  const onSubmit = (data: CreateProjectInput) => {
    setIsSubmitting(true)
    createMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Enter the details for your new project and add team members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Project Name <span className="text-red-500">*</span></Label>
            <Input id="name" placeholder="E.g., Automated Material Handling" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description
              {projectType && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  (auto-filled if left blank)
                </span>
              )}
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the project goals and scope..."
              className="resize-none h-20"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* ── Academic Context ─────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <GraduationCap className="h-4 w-4 text-primary" />
              Academic Context
              <span className="text-xs font-normal text-muted-foreground ml-1">(optional)</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Course Code */}
              <div className="space-y-2">
                <Label>Course Code</Label>
                <Select value={courseCode} onValueChange={setCourseCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {COURSE_CODES.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Project Type */}
              <div className="space-y-2">
                <Label>Project Type</Label>
                <Select value={projectType} onValueChange={setProjectType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom (no template)</SelectItem>
                    {PROJECT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Template info banner */}
            {seedCount > 0 ? (
              <div className="flex items-start gap-2 rounded-lg bg-primary/8 border border-primary/20 px-3 py-2.5 text-sm">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-primary">{seedCount} starter tasks</span> will be
                  auto-populated in your Kanban board when this project is created.
                </span>
              </div>
            ) : projectType && projectType !== "custom" ? null : (
              <p className="text-xs text-muted-foreground">
                Selecting a Project Type will auto-populate engineering tasks in your Kanban board.
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 flex flex-col">
              <Label>Start Date <span className="text-red-500">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full pl-3 text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    {startDate ? format(new Date(startDate), "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate ? new Date(startDate) : undefined}
                    onSelect={(date) =>
                      setValue("startDate", date?.toISOString() || "", { shouldValidate: true })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
            </div>

            <div className="space-y-2 flex flex-col">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full pl-3 text-left font-normal", !endDate && "text-muted-foreground")}
                  >
                    {endDate ? format(new Date(endDate), "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate ? new Date(endDate) : undefined}
                    onSelect={(date) =>
                      setValue("endDate", date?.toISOString() || undefined, { shouldValidate: true })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Team Members Multi-Select */}
          <div className="space-y-2">
            <Label>Team Members</Label>
            <p className="text-xs text-muted-foreground">You will be added as Admin automatically.</p>

            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-1">
                {selectedMembers.map((member) => (
                  <Badge key={member.id} variant="secondary" className="gap-1 pr-1">
                    {member.name}
                    <button
                      type="button"
                      onClick={() => removeMember(member.id)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <Popover open={memberSearchOpen} onOpenChange={setMemberSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={memberSearchOpen}
                  className="w-full justify-between font-normal"
                  type="button"
                >
                  <span className="text-muted-foreground">Search and add team members...</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <div className="p-2 border-b">
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8"
                  />
                </div>
                <ScrollArea className="max-h-[30vh] sm:max-h-[200px]">
                  <div className="p-1">
                    {filteredUsers.length === 0 ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">No users found.</div>
                    ) : (
                      filteredUsers.map((user) => {
                        const isSelected = selectedMembers.some((m) => m.id === user.id)
                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => toggleMember(user)}
                            className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                              {user.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{user.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                          </button>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
