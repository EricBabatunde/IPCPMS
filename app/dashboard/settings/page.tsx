"use client"

import { useTheme } from "next-themes"
import { Moon, Sun, Monitor, Bell, Shield } from "lucide-react"

import { PageHeader } from "@/components/shared/PageHeader"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  const { setTheme, theme } = useTheme()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader 
        title="Settings" 
        description="Manage your appearance and system preferences."
      />

      <div className="grid gap-6">
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how IPCPMS looks on your device.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button 
                onClick={() => setTheme("light")}
                className={`p-4 rounded-xl border-2 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-900 ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800'}`}
              >
                <Sun className="h-5 w-5 mb-2" />
                <div className="font-semibold text-sm">Light</div>
                <div className="text-xs text-slate-500">Day mode style</div>
              </button>
              
              <button 
                onClick={() => setTheme("dark")}
                className={`p-4 rounded-xl border-2 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-900 ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800'}`}
              >
                <Moon className="h-5 w-5 mb-2" />
                <div className="font-semibold text-sm">Dark</div>
                <div className="text-xs text-slate-500">Night mode style</div>
              </button>

              <button 
                onClick={() => setTheme("system")}
                className={`p-4 rounded-xl border-2 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-900 ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800'}`}
              >
                <Monitor className="h-5 w-5 mb-2" />
                <div className="font-semibold text-sm">System</div>
                <div className="text-xs text-slate-500">Device default</div>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Choose what notifications you want to receive.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Task Assignments</Label>
                <p className="text-sm text-slate-500">Receive alerts when a task is assigned to you.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mention Notifications</Label>
                <p className="text-sm text-slate-500">Receive alerts when you are mentioned in a chat.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Project Updates</Label>
                <p className="text-sm text-slate-500">Receive alerts for major project status changes.</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm border-red-100 dark:border-red-950">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-600">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Data management and security settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50/50 dark:bg-red-950/10 rounded-xl border border-red-100 dark:border-red-950/30">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-red-900 dark:text-red-400">Two-factor Authentication</div>
                <p className="text-xs text-red-700/70 dark:text-red-400/50">Add an extra layer of security to your account.</p>
              </div>
              <Button variant="outline" size="sm" className="border-red-200 dark:border-red-900 hover:bg-red-100">Setup</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
