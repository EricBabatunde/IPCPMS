"use client"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { FileIcon } from "@/components/shared/FileIcon"
import { UploadDropzone } from "@/lib/uploadthing"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Download, Loader2 } from "lucide-react"

export function ProjectFiles({ projectId }: { projectId: string }) {
  const { data: files = [], isLoading, refetch } = useQuery({
    queryKey: ["projects", projectId, "files"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/files`)
      if (!res.ok) throw new Error("Failed to fetch files")
      return res.json()
    },
  })

  // We map UploadThing uploader event back to our API 
  const handleUploadComplete = async (res: any[]) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    // Process all uploaded files
    for (const file of res) {
      await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          url: file.url,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
        }),
      })
    }
    // Refetch the list
    refetch()
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
            <CardDescription>Upload design assets, documentation, or spreadsheets here.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
              <UploadDropzone
                endpoint="projectFile"
                onClientUploadComplete={handleUploadComplete}
                onUploadError={(error: Error) => {
                  alert(`ERROR! ${error.message}`)
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Project Gallery</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <p>No files uploaded yet.</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                  {files.map((file: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <div key={file.id} className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 hover:shadow-md transition-all">
                      <div className="flex h-24 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-900 mb-3">
                        <FileIcon mimeType={file.mimeType} className="h-10 w-10 text-slate-400" />
                      </div>
                      <h4 className="text-sm font-medium line-clamp-1" title={file.name}>
                        {file.name}
                      </h4>
                      <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                        <span>{formatSize(file.size)}</span>
                        <span>{format(new Date(file.uploadedAt), "MMM d")}</span>
                      </div>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute right-2 top-2 rounded-md bg-white/80 p-1.5 text-slate-700 opacity-0 shadow-sm backdrop-blur transition-opacity hover:bg-slate-100 group-hover:opacity-100 dark:bg-slate-950/80 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
