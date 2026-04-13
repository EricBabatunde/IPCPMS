"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, ControllerRenderProps } from "react-hook-form"
import * as z from "zod"
import { Loader2, Camera, Mail, Building, User } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUploadThing } from "@/lib/uploadthing"
import { PageHeader } from "@/components/shared/PageHeader"

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  bio: z.string().max(500).optional(),
  department: z.string().max(100).optional(),
  image: z.string().url().optional().or(z.literal("")),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const queryClient = useQueryClient()
  const [isUpdatingImage, setIsUpdatingImage] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/user/profile")
      if (!res.ok) throw new Error("Failed to fetch profile")
      return res.json()
    },
  })

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile?.name || "",
      bio: profile?.bio || "",
      department: profile?.department || "",
      image: profile?.image || "",
    },
    values: profile, // Sync form with query data
  })

  const { startUpload, isUploading } = useUploadThing("profileImage", {
    onClientUploadComplete: async (res) => {
      if (res?.[0]) {
        updateProfileMutation.mutate({ image: res[0].url })
      }
      setIsUpdatingImage(false)
    },
    onUploadError: () => {
      toast.error("Failed to upload image")
      setIsUpdatingImage(false)
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (values: Partial<ProfileFormValues> & { image?: string }) => {
      if (!session?.user?.id) throw new Error("Not authenticated")
      const res = await fetch(`/api/users/${session.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error("Failed to update profile")
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["profile"], data)
      toast.success("Profile updated successfully")
      // Update session for Topbar
      update({ name: data.name, image: data.image })
    },
    onError: () => {
      toast.error("Something went wrong.")
    },
  })

  function onSubmit(data: ProfileFormValues) {
    updateProfileMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-24">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader 
        title="Settings" 
        description="Manage your account settings and profile information."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4 flex flex-col items-center p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm h-fit">
          <div className="relative group">
            <Avatar className="h-32 w-32 ring-4 ring-slate-50 dark:ring-slate-900 shadow-xl">
              <AvatarImage src={profile?.image || ""} />
              <AvatarFallback className="text-4xl bg-primary text-primary-foreground font-bold">
                {profile?.name?.split(" ").map((n: string) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <label htmlFor="image-upload" className="cursor-pointer">
                <Camera className="h-8 w-8 text-white" />
              </label>
            </div>
            {(isUploading || isUpdatingImage) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
            <input 
              type="file" 
              id="image-upload" 
              className="hidden" 
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setIsUpdatingImage(true)
                  startUpload([e.target.files[0]])
                }
              }}
            />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold">{profile?.name}</h3>
            <p className="text-sm text-slate-500">{profile?.role}</p>
          </div>
          
          <div className="w-full pt-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Mail className="h-4 w-4" />
              <span>{profile?.email}</span>
            </div>
            {profile?.department && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Building className="h-4 w-4" />
                <span>{profile?.department}</span>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }: { field: ControllerRenderProps<ProfileFormValues, "name"> }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input placeholder="John Doe" className="pl-10 h-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }: { field: ControllerRenderProps<ProfileFormValues, "department"> }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="Software Engineering" className="h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }: { field: ControllerRenderProps<ProfileFormValues, "bio"> }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us a little bit about yourself" 
                        className="resize-none min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      This will be displayed on your profile and team directory.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  className="px-8 h-10 rounded-xl"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
