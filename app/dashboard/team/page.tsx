"use client"

import { useQuery } from "@tanstack/react-query"
import { Mail, Phone, Loader2 } from "lucide-react"

import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { UserAvatar } from "@/components/shared/UserAvatar"

export default function TeamPage() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users")
      if (!res.ok) throw new Error("Failed to fetch team members")
      return res.json()
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Team Members" 
        description="View and connect with people across your organization."
      />

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {users.map((user: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
            <Card key={user.id} className="overflow-hidden border-slate-200 shadow-sm dark:border-slate-800 transition-all hover:shadow-md">
              <CardHeader className="p-4 pb-2 text-center border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20">
                <div className="flex justify-center mb-3">
                  <UserAvatar user={user} className="h-16 w-16 text-lg border-2 border-white dark:border-slate-800 shadow-sm" />
                </div>
                <h3 className="font-semibold text-lg line-clamp-1">{user.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {user.jobTitle || "Team Member"}
                </p>
                {user.department && (
                  <p className="text-xs text-primary bg-primary/10 inline-block px-2 py-0.5 rounded-full mt-2 font-medium">
                    {user.department}
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-4 space-y-3 pt-4 text-sm">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <a href={`mailto:${user.email}`} className="hover:text-primary transition-colors line-clamp-1">
                    {user.email}
                  </a>
                </div>
                {user.phoneNumber && (
                   <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                     <Phone className="h-4 w-4 text-slate-400" />
                     <a href={`tel:${user.phoneNumber}`} className="hover:text-primary transition-colors">
                       {user.phoneNumber}
                     </a>
                   </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
