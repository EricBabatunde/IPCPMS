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
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }
    return session.user.id
  } catch (error) {
    // Re-throw auth failures as a clean UploadThing-compatible error
    if (error instanceof Error && error.message === "Unauthorized") {
      throw error
    }
    console.error("[UPLOADTHING_AUTH]", error)
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
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    blob: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const userId = await getAuthUserId()
      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url, name: file.name }
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
export const { UploadButton, UploadDropzone, Uploader } = generateComponents<OurFileRouter>()
