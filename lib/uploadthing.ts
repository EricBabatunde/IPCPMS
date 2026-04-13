import { createUploadthing, type FileRouter } from "uploadthing/next"
import { auth } from "@/auth"

const f = createUploadthing()

/**
 * Safely retrieves the authenticated user ID from NextAuth v5.
 * Throws a clear "Unauthorized" error if session is missing.
 */
async function getAuthUserId(): Promise<string> {
  try {
    const session = await auth()
    
    if (!session) {
      console.warn("[UPLOADTHING_AUTH] Session is null - User not logged in")
      throw new Error("Unauthorized")
    }

    if (!session?.user?.id) {
      console.warn("[UPLOADTHING_AUTH] Session exists but User ID is missing")
      throw new Error("Unauthorized")
    }

    return session.user.id
  } catch (error) {
    console.error("[UPLOADTHING_AUTH_CRITICAL_FAILURE]", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      throw error
    }
    throw new Error("Unauthorized")
  }
}

export const ourFileRouter = {
  projectFile: f({
    image: { maxFileSize: "8MB", maxFileCount: 10 },
    pdf: { maxFileSize: "16MB", maxFileCount: 5 },
    text: { maxFileSize: "4MB", maxFileCount: 5 },
    blob: { maxFileSize: "16MB", maxFileCount: 5 },
  })
    .middleware(async () => {
      const userId = await getAuthUserId()
      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url, name: file.name, size: file.size }
    }),

  messageAttachment: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
    text: { maxFileSize: "16MB", maxFileCount: 1 },
    video: { maxFileSize: "32MB", maxFileCount: 1 },
    audio: { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const userId = await getAuthUserId()
      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url, name: file.name, type: file.type, size: file.size }
    }),

  profileImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const userId = await getAuthUserId()
      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

import { generateComponents } from "@uploadthing/react"
import { generateReactHelpers } from "@uploadthing/react/hooks"
export const { UploadButton, UploadDropzone, Uploader } = generateComponents<OurFileRouter>()
export const { useUploadThing } = generateReactHelpers<OurFileRouter>()
